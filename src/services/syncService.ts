import { db } from '../db/db';
import { supabase } from '../lib/supabase';

export const syncService = {
  async isOnline() {
    return navigator.onLine;
  },

  async syncCategories(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      // Studio ACOM categories are global for now, so we sync all
      const localCats = await db.categories.toArray();
      for (const cat of localCats) {
        // Map to snake_case for Supabase
        const { coverImage, ...rest } = cat as any;
        await supabase.from('studio_acom_categories').upsert({
          ...rest,
          cover_image: coverImage || (cat as any).cover_image
        });
      }

      const { data: remoteCats, error } = await supabase
        .from('studio_acom_categories')
        .select('*');

      if (error) throw error;

      if (remoteCats) {
        // Map back to camelCase for Dexie
        const mappedCats = remoteCats.map(c => ({
          ...c,
          coverImage: c.cover_image
        }));
        await db.categories.bulkPut(mappedCats);
      }
    } catch (error) {
      console.error('Sync categories failed:', error);
    }
  },

  async syncProducts(merchantId: string) {
    if (!(await this.isOnline())) return;

    try {
      // Studio ACOM products are also global for now
      const localProducts = await db.products.toArray();
      for (const product of localProducts) {
        const { coverImage, categoryId, ...rest } = product as any;
        await supabase.from('studio_acom_products').upsert({
          ...rest,
          category_id: categoryId || (product as any).category_id,
          cover_image: coverImage || (product as any).cover_image
        });
      }

      const { data: remoteProducts, error } = await supabase
        .from('studio_acom_products')
        .select('*');

      if (error) throw error;

      if (remoteProducts) {
        const mappedProducts = remoteProducts.map(p => ({
          ...p,
          categoryId: p.category_id,
          coverImage: p.cover_image
        }));
        await db.products.bulkPut(mappedProducts);
      }
    } catch (error) {
      console.error('Sync products failed:', error);
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
      // Settings might be global or per-merchant. 
      // The schema doesn't have merchant_id for settings yet, so we fetch all or by ID.
      const { data: remoteSettings, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      if (remoteSettings) {
        // Map data if it's wrapped in a 'data' column
        const mappedSettings = remoteSettings.map(s => {
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
