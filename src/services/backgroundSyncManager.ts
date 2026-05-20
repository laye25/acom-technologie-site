import { syncService } from '../services/syncService';

interface SyncTask {
  id: string;
  name: string;
  // Frequency in milliseconds
  throttleMs: number;
  syncFn: (force?: boolean) => Promise<void>;
  lastSyncKey: string;
}

class BackgroundSyncManager {
  private tasks: SyncTask[] = [];
  private intervalId: any = null;
  private userId: string | null = null;
  private merchantId: string | null = null;
  private isAdmin: boolean = false;

  private role: string | null = null;

  setContext(user: { uid: string }, merchantId: string | null, isAdmin: boolean, role?: string) {
    this.userId = user.uid;
    this.merchantId = merchantId;
    this.isAdmin = isAdmin;
    this.role = role || null;
    this.initTasks();
  }

  private initTasks() {
    this.tasks = [];
    if (!this.userId) return;

    if (this.isAdmin) {
      this.addTask({
        id: 'orders',
        name: 'Orders',
        throttleMs: 900000, // 15 mins
        syncFn: () => syncService.syncOrders('global'),
        lastSyncKey: `last_sync_orders_global`
      });
    } else if (this.role === 'partner' || this.role === 'printer' || this.role === 'designer') {
      this.addTask({
        id: 'orders', // partner orders
        name: 'Partner Orders',
        throttleMs: 900000, // 15 mins
        syncFn: () => syncService.syncPartnerOrders(this.userId!),
        lastSyncKey: `last_sync_partner_orders_${this.userId}`
      });
    } else {
      // General customer or other role (could be merchant without admin... but mostly customer here)
      // Actually we don't need a background task for ordinary client orders if they use Real-time subscriptions, 
      // but let's sync their user orders via a new syncUserOrders method if needed.
      // But for now, just don't run merchant orders for them.
    }

    this.addTask({
      id: 'notifications',
      name: 'Notifications',
      throttleMs: 300000, // 5 mins
      syncFn: () => syncService.syncNotifications(this.userId!),
      lastSyncKey: `last_sync_notifications_${this.userId}`
    });

    this.addTask({
        id: 'designs',
        name: 'Designs',
        throttleMs: 1800000, // 30 mins
        syncFn: () => syncService.syncDesigns(this.isAdmin ? 'global' : this.userId!),
        lastSyncKey: `last_sync_designs_${this.isAdmin ? 'global' : this.userId}`
    });

    this.addTask({
      id: 'activities',
      name: 'Activities',
      throttleMs: 600000, // 10 mins
      syncFn: () => syncService.syncActivities(this.isAdmin ? 'global' : (this.merchantId || undefined)),
      lastSyncKey: `last_sync_activities_${this.isAdmin ? 'global' : (this.merchantId || 'global')}`
    });

    if (this.merchantId) {
        this.addTask({
            id: 'merchant_data',
            name: 'Merchant Data',
            throttleMs: 1800000, // 30 mins
            syncFn: () => syncService.syncAllMerchantData(this.merchantId!),
            lastSyncKey: `last_sync_merchant_data_${this.merchantId}`
        });

        this.addTask({
            id: 'users',
            name: 'Users',
            throttleMs: 1800000, // 30 mins
            syncFn: () => syncService.syncUsers(this.merchantId!),
            lastSyncKey: `last_sync_users_${this.merchantId}`
        });

        this.addTask({
            id: 'settings',
            name: 'Settings',
            throttleMs: 3600000, // 1 hour
            syncFn: () => syncService.syncSettings(this.merchantId!),
            lastSyncKey: `last_sync_settings_${this.merchantId}`
        });
    }
  }

  addTask(task: SyncTask) {
    this.tasks.push(task);
  }

  async start() {
    this.stop();
    
    // Process immediately
    this.runSyncLoop();
    
    // Interval: Check every 5 minutes (reduced from 1 min to save more quota)
    this.intervalId = setInterval(() => this.runSyncLoop(), 300000);
  }

  private async runSyncLoop() {
    console.log('[SyncManager] Iterating tasks...');
    for (const task of this.tasks) {
      const lastSync = localStorage.getItem(task.lastSyncKey);
      if (!lastSync || Date.now() - parseInt(lastSync, 10) > task.throttleMs) {
        console.log(`[SyncManager] Running background sync for: ${task.name}`);
        await task.syncFn();
        localStorage.setItem(task.lastSyncKey, Date.now().toString());
      }
    }
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

export const syncManager = new BackgroundSyncManager();
