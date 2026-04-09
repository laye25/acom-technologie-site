import { db } from '../db/db';
import { supabase } from '../lib/supabase';

export const syncService = {
  async isOnline() {
    return navigator.onLine;
  },

  async syncCategories(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const localCats = await db.categories.where('merchantId').equals(merchantId).toArray();
      for (const cat of localCats) {
        await supabase.from('studio_acom_categories').upsert(cat);
      }

      const { data: remoteCats, error } = await supabase
        .from('studio_acom_categories')
        .select('*')
        .eq('merchant_id', merchantId);

      if (error) throw error;

      if (remoteCats) {
        await db.categories.bulkPut(remoteCats);
      }
    } catch (error) {
      console.error('Sync categories failed:', error);
    }
  },

  async syncProducts(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      // 1. Push local changes to Supabase
      const localProducts = await db.products.where('merchantId').equals(merchantId).toArray();
      for (const product of localProducts) {
        await supabase.from('merchant_products').upsert(product);
      }

      // 2. Fetch remote changes and update local
      const { data: remoteProducts, error } = await supabase
        .from('merchant_products')
        .select('*')
        .eq('merchant_id', merchantId);

      if (error) throw error;

      if (remoteProducts) {
        await db.products.bulkPut(remoteProducts);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  // Add similar methods for sales and expenses
  async syncSales(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      const localSales = await db.sales.where('merchantId').equals(merchantId).toArray();
      for (const sale of localSales) {
        await supabase.from('merchant_sales').upsert(sale);
      }

      const { data: remoteSales, error } = await supabase
        .from('merchant_sales')
        .select('*')
        .eq('merchant_id', merchantId);

      if (error) throw error;

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
        await supabase.from('merchant_expenses').upsert(expense);
      }

      const { data: remoteExpenses, error } = await supabase
        .from('merchant_expenses')
        .select('*')
        .eq('merchant_id', merchantId);

      if (error) throw error;

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
      const { data: remoteOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId);
      if (error) throw error;
      if (remoteOrders) await db.orders.bulkPut(remoteOrders);
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncServices(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const { data: remoteServices, error } = await supabase
        .from('services')
        .select('*')
        .eq('merchant_id', merchantId);
      if (error) throw error;
      if (remoteServices) await db.services.bulkPut(remoteServices);
    } catch (error) {
      console.error('Sync services failed:', error);
    }
  },

  async syncUsers(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const { data: remoteUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('merchant_id', merchantId);
      if (error) throw error;
      if (remoteUsers) await db.users.bulkPut(remoteUsers);
    } catch (error) {
      console.error('Sync users failed:', error);
    }
  },

  async syncSettings(merchantId: string) {
    if (!(await this.isOnline())) return;
    try {
      const { data: remoteSettings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('merchant_id', merchantId);
      if (error) throw error;
      if (remoteSettings) await db.settings.bulkPut(remoteSettings);
    } catch (error) {
      console.error('Sync settings failed:', error);
    }
  }
};
