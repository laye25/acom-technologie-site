import { db } from '../db/db';
import { where } from 'firebase/firestore';
import { merchantSaleRepository } from '../data/repositories/merchant-sale.repository';
import { merchantExpenseRepository } from '../data/repositories/merchant-expense.repository';
import { orderRepository } from '../data/repositories/order.repository';
import { serviceRepository } from '../data/repositories/service.repository';
import { userRepository } from '../data/repositories/user.repository';

export const syncService = {
  async isOnline() {
    return navigator.onLine;
  },

  // Add similar methods for sales and expenses
  async syncSales(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const lastSyncKey = `last_sync_sales_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('merchant_id', '==', merchantId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing sales... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteSales = await merchantSaleRepository.getAll(constraints);

      if (remoteSales && remoteSales.length > 0) {
        await db.sales.bulkPut(remoteSales);
      }
      
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync sales failed:', error);
    }
  },

  async syncExpenses(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const lastSyncKey = `last_sync_expenses_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('merchant_id', '==', merchantId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing expenses... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteExpenses = await merchantExpenseRepository.getAll(constraints);

      if (remoteExpenses && remoteExpenses.length > 0) {
        await db.expenses.bulkPut(remoteExpenses);
      }
      
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync expenses failed:', error);
    }
  },

  async syncOrders(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = 'last_sync_orders';
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      
      console.log(`Syncing orders from Firebase... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteOrders = await orderRepository.getAll(constraints);
      console.log('Orders fetched from Firebase:', remoteOrders?.length || 0);
      
      if (remoteOrders && remoteOrders.length > 0) {
        await db.orders.bulkPut(remoteOrders);
        console.log('Orders synced to Dexie successfully');
      }
      
      // Save sync time, subtract 1 minute to avoid missing edge-case writes during fetch
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncServices(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = `last_sync_services_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('merchant_id', '==', merchantId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing services... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteServices = await serviceRepository.getAll(constraints);
      if (remoteServices && remoteServices.length > 0) {
        await db.services.bulkPut(remoteServices);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync services failed:', error);
    }
  },

  async syncUsers(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = `last_sync_users_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('merchant_id', '==', merchantId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing users... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteUsers = await userRepository.getAll(constraints);
      if (remoteUsers && remoteUsers.length > 0) {
        await db.users.bulkPut(remoteUsers);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync users failed:', error);
    }
  },

  async syncSettings(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = `last_sync_settings_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = []; // settings are often global or limited, assuming global for repo

      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'settings';
      })();
      const remoteSettings = await repo.getAll(constraints);
      
      if (remoteSettings && remoteSettings.length > 0) {
        // Map data if it's wrapped in a 'data' column
        const mappedSettings = remoteSettings.map((s: any) => {
          if (s.data && typeof s.data === 'object') {
            return { ...s.data, id: s.id };
          }
          return s;
        });
        await db.settings.bulkPut(mappedSettings);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync settings failed:', error);
    }
  }
};
