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
      const localSales = await db.sales.where('merchantId').equals(merchantId).toArray();
      for (const sale of localSales) {
        if (sale.id) {
          await merchantSaleRepository.update(sale.id, sale as any);
        } else {
          await merchantSaleRepository.create(sale as any);
        }
      }

      const remoteSales = await merchantSaleRepository.getAll([
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
        if (expense.id) {
          await merchantExpenseRepository.update(expense.id, expense as any);
        } else {
          await merchantExpenseRepository.create(expense as any);
        }
      }

      const remoteExpenses = await merchantExpenseRepository.getAll([
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
      console.log('Syncing orders from Firebase...');
      const remoteOrders = await orderRepository.getAll();
      console.log('Orders fetched from Firebase:', remoteOrders?.length || 0);
      if (remoteOrders) {
        await db.orders.bulkPut(remoteOrders);
        console.log('Orders synced to Dexie successfully');
      }
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncServices(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const remoteServices = await serviceRepository.getAll([
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
      const remoteUsers = await userRepository.getAll([
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
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'settings';
      })();
      const remoteSettings = await repo.getAll();
      
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
