import { db } from '../db/db';
import { firestoreService } from './firestoreService';
import { where } from 'firebase/firestore';

export const syncService = {
  async isOnline() {
    return navigator.onLine;
  },

  // Add similar methods for sales and expenses
  async syncSales(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const localSales = await db.sales.where('merchantId').equals(merchantId).toArray();
      for (const sale of localSales) {
        await firestoreService.save('merchant_sales', sale);
      }

      const remoteSales = await firestoreService.getAll<any>('merchant_sales', [
        where('merchant_id', '==', merchantId)
      ]);

      if (remoteSales) {
        await db.sales.bulkPut(remoteSales);
      }
    } catch (error) {
      console.error('Sync sales failed:', error);
    }
  },

  async syncExpenses(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const localExpenses = await db.expenses.where('merchantId').equals(merchantId).toArray();
      for (const expense of localExpenses) {
        await firestoreService.save('merchant_expenses', expense);
      }

      const remoteExpenses = await firestoreService.getAll<any>('merchant_expenses', [
        where('merchant_id', '==', merchantId)
      ]);

      if (remoteExpenses) {
        await db.expenses.bulkPut(remoteExpenses);
      }
    } catch (error) {
      console.error('Sync expenses failed:', error);
    }
  },

  async syncOrders(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const remoteOrders = await firestoreService.getAll<any>('orders', [
        where('merchant_id', '==', merchantId)
      ]);
      if (remoteOrders) await db.orders.bulkPut(remoteOrders);
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncServices(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const remoteServices = await firestoreService.getAll<any>('services', [
        where('merchant_id', '==', merchantId)
      ]);
      if (remoteServices) await db.services.bulkPut(remoteServices);
    } catch (error) {
      console.error('Sync services failed:', error);
    }
  },

  async syncUsers(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const remoteUsers = await firestoreService.getAll<any>('users', [
        where('merchant_id', '==', merchantId)
      ]);
      if (remoteUsers) await db.users.bulkPut(remoteUsers);
    } catch (error) {
      console.error('Sync users failed:', error);
    }
  },

  async syncSettings(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const remoteSettings = await firestoreService.getAll<any>('settings');
      
      if (remoteSettings) {
        // Map data if it's wrapped in a 'data' column
        const mappedSettings = remoteSettings.map((s: any) => {
          if (s.data && typeof s.data === 'object') {
            return { ...s.data, id: s.id };
          }
          return s;
        });
        await db.settings.bulkPut(mappedSettings);
      }
    } catch (error) {
      console.error('Sync settings failed:', error);
    }
  }
};
