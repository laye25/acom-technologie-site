import { db } from '../db/db';
import { where, limit } from 'firebase/firestore';
import { merchantSaleRepository } from '../data/repositories/merchant-sale.repository';
import { merchantExpenseRepository } from '../data/repositories/merchant-expense.repository';
import { merchantProductRepository } from '../data/repositories/merchant-product.repository';
import { orderRepository } from '../data/repositories/order.repository';
import { serviceRepository } from '../data/repositories/service.repository';
import { userRepository } from '../data/repositories/user.repository';
import { designRepository } from '../data/repositories/design.repository';
import { partnerRatingRepository } from '../data/repositories/partner-rating.repository';
import { assetRepository } from '../data/repositories/asset.repository';
import { templateRepository } from '../data/repositories/template.repository';
import { designBlockRepository } from '../data/repositories/design-block.repository';
import { messageRepository } from '../data/repositories/message.repository';
import { MerchantProduct } from '../types';

export const syncService = {
  async isOnline(merchantId?: string) {
    const quotaExceededStr = localStorage.getItem('firebase_quota_exceeded');
    if (quotaExceededStr) {
      const exceededAt = parseInt(quotaExceededStr, 10);
      // Disable remote sync for 1 hour after hitting quota
      if (Date.now() - exceededAt < 3600000) {
        return false;
      } else {
        localStorage.removeItem('firebase_quota_exceeded');
      }
    }

    // Check license restriction
    if (merchantId) {
      try {
        const merchant = await db.merchants.get(merchantId);
        if (merchant && merchant.licenseType === 'local') {
          return false; // Force offline for local-only license
        }
      } catch (e) {
        // Fallback to online if check fails
      }
    }

    return navigator.onLine;
  },

  async syncProducts(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_products_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle: 1 hour for background/merchant sync
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 3600000) {
        return;
      }

      const timeConstraints: any[] = [];
      if (lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing products... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      let remoteProducts = await merchantProductRepository.getAll([where('merchant_id', '==', merchantId), ...timeConstraints]);
      if (!remoteProducts || remoteProducts.length === 0) {
        remoteProducts = await merchantProductRepository.getAll([where('merchantId', '==', merchantId), ...timeConstraints]);
      }
      
      if (remoteProducts && remoteProducts.length > 0) {
        // Map to local DB format
        const mappedProducts = remoteProducts.map((p: any) => ({
          ...p,
          merchantId: p.merchant_id,
          costPrice: p.cost_price,
          stockQuantity: p.stock_quantity,
          minStockLevel: p.min_stock_level,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        await db.products.bulkPut(mappedProducts);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync products failed:', error);
    }
  },

  // Add similar methods for sales and expenses
  async syncSales(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_sales_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 3600000) {
        return;
      }

      const timeConstraints: any[] = [];
      if (lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing sales... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      let remoteSales = await merchantSaleRepository.getAll([where('merchant_id', '==', merchantId), ...timeConstraints]);
      if (!remoteSales || remoteSales.length === 0) {
        remoteSales = await merchantSaleRepository.getAll([where('merchantId', '==', merchantId), ...timeConstraints]);
      }

      if (remoteSales && remoteSales.length > 0) {
        // Map to local DB format
        const mappedSales = remoteSales.map((s: any) => ({
          ...s,
          merchantId: s.merchant_id,
          totalAmount: s.total_amount,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
        await db.sales.bulkPut(mappedSales);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync sales failed:', error);
    }
  },

  async syncExpenses(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_expenses_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 3600000) {
        return;
      }

      const timeConstraints: any[] = [];
      if (lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing expenses... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      let remoteExpenses = await merchantExpenseRepository.getAll([where('merchant_id', '==', merchantId), ...timeConstraints]);
      if (!remoteExpenses || remoteExpenses.length === 0) {
        remoteExpenses = await merchantExpenseRepository.getAll([where('merchantId', '==', merchantId), ...timeConstraints]);
      }

      if (remoteExpenses && remoteExpenses.length > 0) {
        // Map to local DB format
        const mappedExpenses = remoteExpenses.map((e: any) => ({
          ...e,
          merchantId: e.merchant_id,
          createdAt: e.created_at,
          updatedAt: e.updated_at
        }));
        await db.expenses.bulkPut(mappedExpenses);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync expenses failed:', error);
    }
  },

  async syncOrders(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_orders_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 600000) { // 10 min for orders
        return;
      }

      const constraints: any[] = [];
      
      if (merchantId && merchantId !== 'global') {
        constraints.push(where('merchantId', '==', merchantId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      
      console.log(`Syncing orders from Firebase... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteOrders = await orderRepository.getAll(constraints);
      
      if (remoteOrders && remoteOrders.length > 0) {
        await db.orders.bulkPut(remoteOrders);
      }
      
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncPartnerOrders(partnerId: string) {
    if (!(await this.isOnline()) || !partnerId) return;
    try {
      const lastSyncKey = `last_sync_partner_orders_${partnerId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 600000) {
        return;
      }

      const constraints: any[] = [where('partnerId', '==', partnerId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      
      const remoteOrders = await orderRepository.getAll(constraints);
      if (remoteOrders && remoteOrders.length > 0) {
        await db.orders.bulkPut(remoteOrders);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync partner orders failed:', error);
    }
  },

  async syncUserProfile(uid: string) {
    if (!(await this.isOnline()) || !uid) return;
    try {
      // Small throttle for profile (30 mins)
      const lastSyncKey = `last_sync_user_profile_${uid}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 1800000) {
        return;
      }

      const remoteUser = await userRepository.getById(uid);
      if (remoteUser) {
        await db.users.put(remoteUser);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync user profile failed:', error);
    }
  },

  async syncServices(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_services_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle 1 hour for services (they change rarely)
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 3600000) {
        return;
      }

      const constraints: any[] = [];
      
      if (merchantId && merchantId !== 'global') {
        constraints.push(where('merchant_id', '==', merchantId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing services... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteServices = await serviceRepository.getAll(constraints);
      if (remoteServices && remoteServices.length > 0) {
        await db.services.bulkPut(remoteServices);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync services failed:', error);
    }
  },

  async syncDesigns(userId: string) {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = `last_sync_designs_${userId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (userId && userId !== 'global') {
        constraints.push(where('userId', '==', userId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      
      const remoteDesigns = await designRepository.getAll(constraints);
      if (remoteDesigns && remoteDesigns.length > 0) {
        await db.designs.bulkPut(remoteDesigns);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync designs failed:', error);
    }
  },

  async syncPartnerRatings() {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = 'last_sync_partner_ratings';
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      const remoteRatings = await partnerRatingRepository.getAll(constraints);
      if (remoteRatings && remoteRatings.length > 0) {
        await db.partner_ratings.bulkPut(remoteRatings);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync ratings failed:', error);
    }
  },

  async syncAssets(userId: string) {
    if (!(await this.isOnline()) || !userId) return;
    try {
      const lastSyncKey = `last_sync_assets_${userId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('userId', '==', userId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing assets... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteAssets = await assetRepository.getAll(constraints);
      
      if (remoteAssets && remoteAssets.length > 0) {
        await db.assets.bulkPut(remoteAssets);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync assets failed:', error);
    }
  },

  async syncTemplates() {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = 'last_sync_templates';
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing templates... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      const remoteTemplates = await templateRepository.getAll(constraints);
      
      if (remoteTemplates && remoteTemplates.length > 0) {
        await db.templates.bulkPut(remoteTemplates);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync templates failed:', error);
    }
  },

  async syncDesignBlocks(designId: string) {
    if (!(await this.isOnline()) || !designId) return;
    try {
      console.log(`Syncing blocks for design ${designId}...`);
      const remoteBlocks = await designBlockRepository.getAll(designId);
      
      if (remoteBlocks && remoteBlocks.length > 0) {
        // Clear old blocks for this design first to ensure consistency
        await db.design_blocks.where('designId').equals(designId).delete();
        await db.design_blocks.bulkPut(remoteBlocks.map(b => ({ ...b, designId })));
      }
    } catch (error) {
      console.error(`Sync blocks failed for design ${designId}:`, error);
    }
  },

  async syncMessages(id: string) {
    if (!(await this.isOnline()) || !id) return;
    try {
      const lastSyncKey = `last_sync_messages_${id}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Try chatId first, then orderId
      let remoteMessages = await messageRepository.getAll([where('chatId', '==', id)]);
      
      if (!remoteMessages || remoteMessages.length === 0) {
        remoteMessages = await messageRepository.getAll([where('orderId', '==', id)]);
      }

      if (remoteMessages && remoteMessages.length > 0) {
        await db.messages.bulkPut(remoteMessages);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error(`Sync messages failed for ${id}:`, error);
    }
  },

  async syncUsers(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_users_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (merchantId && merchantId !== 'global') {
        constraints.push(where('merchant_id', '==', merchantId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // Initial sync: last 30 days instead of 7 for better coverage
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 30)));
      }

      console.log(`Syncing users... ${lastSyncStr ? '(Delta)' : '(Initial / Recent)'}`);
      const remoteUsers = await userRepository.getAll(constraints);
      
      // CRITICAL: Always explicitly fetch pending applications and approved partners
      // to ensure they are visible to admins even if they haven't been updated recently.
      let extraUsers: any[] = [];
      if (!merchantId || merchantId === 'global') {
        const [pendingUsers, approvedUsers] = await Promise.all([
          userRepository.getAll([where('partnerStatus', '==', 'pending')]),
          userRepository.getAll([where('partnerStatus', '==', 'approved')])
        ]);
        extraUsers = [...pendingUsers, ...approvedUsers];
      }

      const allUsersToSync = [...remoteUsers];
      // Add extra users that weren't in the time-constrained list
      extraUsers.forEach(eu => {
        const id = eu.id || (eu as any).uid;
        if (!allUsersToSync.find(u => (u.id || (u as any).uid) === id)) {
          allUsersToSync.push(eu);
        }
      });

      if (allUsersToSync.length > 0) {
        await db.users.bulkPut(allUsersToSync);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync users failed:', error);
    }
  },

  async syncSaaSCollection(merchantId: string, collectionName: string, localTable: any) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const lastSyncKey = `last_sync_${collectionName}_${merchantId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      const timeConstraints: any[] = [];
      if (lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing ${collectionName}... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = collectionName;
      })();
      
      // Try with merchant_id
      let remoteData = await repo.getAll([where('merchant_id', '==', merchantId), ...timeConstraints]);
      
      // If nothing found or to be safe, try with merchantId
      if (!remoteData || remoteData.length === 0) {
        remoteData = await repo.getAll([where('merchantId', '==', merchantId), ...timeConstraints]);
      }

      if (remoteData && remoteData.length > 0) {
        // Map data if needed (standardize merchantId)
        const mappedData = remoteData.map((d: any) => ({
          ...d,
          merchantId: d.merchant_id || d.merchantId
        }));
        await localTable.bulkPut(mappedData);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error(`Sync ${collectionName} failed:`, error);
    }
  },

  async syncAllMerchantData(merchantId: string) {
    const collections = [
      { name: 'merchant_products', table: db.products },
      { name: 'merchant_sales', table: db.sales },
      { name: 'merchant_expenses', table: db.expenses },
      { name: 'interventions', table: db.interventions },
      { name: 'projects', table: db.projects },
      { name: 'vehicles', table: db.vehicles },
      { name: 'employees', table: db.employees },
      { name: 'students', table: db.students },
      { name: 'patients', table: db.patients },
      { name: 'appointments', table: db.appointments },
      { name: 'merchant_suppliers', table: db.suppliers },
      { name: 'stock_movements', table: db.movements }
    ];
    
    for (const col of collections) {
      await this.syncSaaSCollection(merchantId, col.name, col.table);
    }
  },

  async syncNotifications(userId: string) {
    if (!(await this.isOnline()) || !userId) return;
    try {
      const lastSyncKey = `last_sync_notifications_${userId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [where('userId', '==', userId)];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing notifications... ${lastSyncStr ? '(Delta)' : '(Full)'}`);
      
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'notifications';
      })();
      
      const remoteData = await repo.getAll(constraints);
      if (remoteData && remoteData.length > 0) {
        await db.notifications.bulkPut(remoteData);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync notifications failed:', error);
    }
  },

  async syncBlogPosts() {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = 'last_sync_blog_posts';
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'blog_posts';
      })();
      const remoteData = await repo.getAll(constraints);
      if (remoteData && remoteData.length > 0) {
        await db.blog_posts.bulkPut(remoteData);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync blog posts failed:', error);
    }
  },

  async syncPortfolioItems() {
    if (!(await this.isOnline())) return;
    try {
      const lastSyncKey = 'last_sync_portfolio_items';
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      const constraints: any[] = [];
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'portfolio'; // Firestore table name is often different
      })();
      const remoteData = await repo.getAll(constraints);
      if (remoteData && remoteData.length > 0) {
        await db.portfolio_items.bulkPut(remoteData);
      }
      localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
    } catch (error) {
      console.error('Sync portfolio items failed:', error);
    }
  },

  async syncSettings(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'settings';
      })();
      const remoteData = await repo.getById(merchantId);
      if (remoteData) {
        await db.settings.put({ ...remoteData, id: merchantId, merchantId });
      }
    } catch (error) {
      console.error('Sync settings failed:', error);
    }
  },

  async pushPendingData(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    
    try {
      console.log('Pushing pending local data to cloud...');
      
      // 1. Pending Sales
      const pendingSales = await db.sales.where('syncStatus').equals('pending').toArray();
      for (const sale of pendingSales) {
        try {
          const { syncStatus, ...data } = sale as any;
          const { merchantSaleRepository } = await import('../data/repositories/merchant-sale.repository');
          await merchantSaleRepository.create(data);
          await db.sales.update(sale.id, { syncStatus: 'synced' } as any);
        } catch (e) {
          console.warn('Failed to push pending sale:', sale.id);
        }
      }

      // 2. Pending Products
      const pendingProducts = await db.products.where('syncStatus').equals('pending').toArray();
      for (const product of pendingProducts) {
        try {
          const { syncStatus, ...data } = product as any;
          const { merchantProductRepository } = await import('../data/repositories/merchant-product.repository');
          if (product.id && product.id.length > 20) { // Assume it already exists if long ID
             await merchantProductRepository.update(product.id, data);
          } else {
             await merchantProductRepository.create(data as any);
          }
          await db.products.update(product.id, { syncStatus: 'synced' } as any);
        } catch (e) {
          console.warn('Failed to push pending product:', product.id);
        }
      }

      // 3. Pending Expenses
      const pendingExpenses = await db.expenses.where('syncStatus').equals('pending').toArray();
      for (const expense of pendingExpenses) {
        try {
          const { syncStatus, ...data } = expense as any;
          const { merchantExpenseRepository } = await import('../data/repositories/merchant-expense.repository');
          if (expense.id && expense.id.length > 20) {
            await merchantExpenseRepository.update(expense.id, data);
          } else {
            await merchantExpenseRepository.create(data as any);
          }
          await db.expenses.update(expense.id, { syncStatus: 'synced' } as any);
        } catch (e) {
          console.warn('Failed to push pending expense:', expense.id);
        }
      }
      
      console.log('Push pending data complete.');
    } catch (error) {
      console.error('Push pending data failed:', error);
    }
  },

  async syncStudioAcomData(userId?: string, isAdmin: boolean = false) {
    if (!(await this.isOnline())) return;
    
    // Global lock to prevent concurrent syncs
    const globalSyncLockKey = 'sync_studio_acom_active';
    if (sessionStorage.getItem(globalSyncLockKey)) return;
    
    try {
      sessionStorage.setItem(globalSyncLockKey, 'true');
      console.log('Syncing Studio Acom data...');
      
      const collections = [
        { name: 'studio_acom_categories', table: db.studio_acom_categories, throttleMs: 300000 }, // 5 min
        { name: 'studio_acom_products', table: db.studio_acom_products, throttleMs: 300000 },
        { name: 'variants', table: db.variants, throttleMs: 300000 },
        { name: 'design_requests', table: db.design_requests, requiresAuth: true, throttleMs: 60000 } // 1 min (more frequent for active requests)
      ];

      for (const col of collections) {
        if (col.requiresAuth && !isAdmin && !userId) {
          continue;
        }

        const lastSyncKey = `last_sync_${col.name}_${col.requiresAuth && !isAdmin ? userId : 'global'}`;
        const lastSyncStr = localStorage.getItem(lastSyncKey);
        
        // Throttle check
        if (lastSyncStr) {
          const lastSyncTime = parseInt(lastSyncStr, 10);
          if (Date.now() - lastSyncTime < col.throttleMs) {
            continue; // Skip this collection if synced recently
          }
        }

        const constraints: any[] = [];
        
        if (col.requiresAuth && !isAdmin && userId) {
           constraints.push(where('userId', '==', userId));
        }

        if (lastSyncStr) {
          constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
        }

        const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
          protected collectionName = col.name;
        })();
        const remoteData = await repo.getAll(constraints);
        if (remoteData && remoteData.length > 0) {
          await col.table.bulkPut(remoteData);
        }
        // Save current time as last sync (no buffer needed as we use >= and throttle)
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
    } catch (error) {
      console.error('Sync Studio Acom data failed:', error);
    } finally {
      sessionStorage.removeItem(globalSyncLockKey);
    }
  },
};
