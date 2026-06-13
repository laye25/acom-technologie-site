import { Activity } from '../data/repositories/activity.repository';
import { db, setRemoteSyncState } from '../db/db';
import { where, limit, orderBy } from 'firebase/firestore';
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
  async isOnline(merchantId?: string, force: boolean = false) {
    const quotaExceededStr = localStorage.getItem('firebase_quota_exceeded');
    if (quotaExceededStr) {
      const exceededAt = parseInt(quotaExceededStr, 10);
      // Disable remote sync for 1 hour after hitting quota (unless forced)
      if (!force && Date.now() - exceededAt < 3600000) {
        console.warn('Sync cancelled: Firebase Quota Exceeded. Next retry in', Math.ceil((3600000 - (Date.now() - exceededAt)) / 60000), 'min');
        return false;
      } else if (!force) {
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
          merchantId: p.merchant_id || p.merchantId,
          costPrice: p.cost_price !== undefined ? p.cost_price : p.costPrice,
          stockQuantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.stockQuantity !== undefined ? p.stockQuantity : 0),
          minStockLevel: p.min_stock_level !== undefined ? p.min_stock_level : (p.minStockLevel !== undefined ? p.minStockLevel : 5),
          createdAt: p.created_at || p.createdAt,
          updatedAt: p.updated_at || p.updatedAt
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
      const lastSyncKey = `last_sync_expenses_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle: 5 minutes for expenses
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 300000) {
        return;
      }

      const timeConstraints: any[] = [];
      if (lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // Initial: last 30 days
        timeConstraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 30)));
      }

      console.log(`Syncing expenses... ${lastSyncStr ? '(Delta)' : '(Initial 30d)'}`);
      const mId = merchantId || 'global';
      let remoteExpenses: any[] = [];
      
      if (mId !== 'global') {
        remoteExpenses = await merchantExpenseRepository.getAll([where('merchant_id', '==', mId), ...timeConstraints]);
        if (!remoteExpenses || remoteExpenses.length === 0) {
          remoteExpenses = await merchantExpenseRepository.getAll([where('merchantId', '==', mId), ...timeConstraints]);
        }
      } else {
        remoteExpenses = await merchantExpenseRepository.getAll([...timeConstraints]);
      }

      if (remoteExpenses && remoteExpenses.length > 0) {
        // Map to local DB format
        const mappedExpenses = remoteExpenses.map((e: any) => ({
          ...e,
          merchantId: e.merchant_id || e.merchantId,
          createdAt: e.created_at || e.createdAt,
          updatedAt: e.updated_at || e.updatedAt
        }));
        await db.expenses.bulkPut(mappedExpenses);
        localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
      } else {
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
    } catch (error) {
      console.error('Sync expenses failed:', error);
    }
  },

  async syncOrders(merchantId: string, force: boolean = false) {
    if (!(await this.isOnline(merchantId, force))) return;
    try {
      const lastSyncKey = `last_sync_orders_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Strict Throttle: 5 minutes between order syncs (unless forced)
      if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 300000) {
        return;
      }

      const constraints: any[] = [];
      
      if (merchantId && merchantId !== 'global') {
        constraints.push(where('merchantId', '==', merchantId));
      }
      
      if (lastSyncStr && !force) {
        const lastSyncDate = new Date(parseInt(lastSyncStr, 10));
        // On recule de 10 min pour être sûr de ne rien rater à cause du décalage de serveur ou propagation Firestore
        const safeDate = new Date(lastSyncDate.getTime() - 600000);
        constraints.push(where('updated_at', '>=', safeDate));
        constraints.push(orderBy('updated_at', 'desc'));
        constraints.push(limit(500)); // Increase limit slightly
      } else if (force) {
        // If forced, check last 30 days to ensure no gap
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 30)));
        constraints.push(orderBy('updated_at', 'desc'));
        constraints.push(limit(2000));
      } else {
        // Initial sync: ONLY fetch last 90 days of orders to prevent quota explosion
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 90)));
        constraints.push(orderBy('updated_at', 'desc'));
        constraints.push(limit(1000)); // Larger limit for initial global sync
      }
      
      console.log(`[syncOrders] Using constraints for ${merchantId || 'global'}:`, constraints.map(c => JSON.stringify(c)));
      
      const remoteOrders = await orderRepository.getAll(constraints);
      console.log(`[syncOrders] Sync completed. Received ${remoteOrders?.length || 0} orders.`);
      
      // Set sync key immediately after successful fetch to prevent retry loops on processing errors
      const currentSyncTime = Date.now().toString();
      
      if (remoteOrders && remoteOrders.length > 0) {
        console.log(`[syncOrders] Adding ${remoteOrders.length} orders to Dexie`);
        await db.orders.bulkPut(remoteOrders);
        localStorage.setItem(lastSyncKey, (parseInt(currentSyncTime) - 600000).toString()); // 10 min overlap
      } else {
        localStorage.setItem(lastSyncKey, currentSyncTime);
      }
    } catch (error) {
      console.error('Sync orders failed:', error);
    }
  },

  async syncPartnerOrders(partnerId: string, force: boolean = false) {
    if (!(await this.isOnline(undefined, force)) || !partnerId) return;
    try {
      const lastSyncKey = `last_sync_partner_orders_${partnerId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 600000) {
        return;
      }

      const constraints1 = [where('partnerId', '==', partnerId)];
      const constraints2 = [where('partner_id', '==', partnerId)];
      
      if (lastSyncStr) {
        constraints1.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
        constraints2.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }
      
      const [remoteOrders1, remoteOrders2] = await Promise.all([
        orderRepository.getAll(constraints1),
        orderRepository.getAll(constraints2)
      ]);
      
      const remoteOrders = [...(remoteOrders1 || []), ...(remoteOrders2 || [])];
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
      
      // Throttle: 5 minutes
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 300000) {
        return;
      }

      const constraints: any[] = [];
      
      if (userId && userId !== 'global') {
        constraints.push(where('userId', '==', userId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // Initial: last 60 days for designs
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 60)));
      }
      
      console.log(`Syncing designs... ${lastSyncStr ? '(Delta)' : '(Initial 60d)'}`);
      const remoteDesigns = await designRepository.getAll(constraints);
      if (remoteDesigns && remoteDesigns.length > 0) {
        await db.designs.bulkPut(remoteDesigns);
        localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
      } else {
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
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
      const lastSyncKey = `last_sync_assets_${userId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle: 10 minutes for assets
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 600000) {
        return;
      }

      const constraints: any[] = [];
      if (userId && userId !== 'global') {
        constraints.push(where('userId', '==', userId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // Initial: last 60 days
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 60)));
      }

      console.log(`Syncing assets... ${lastSyncStr ? '(Delta)' : '(Initial 60d)'}`);
      const remoteAssets = await assetRepository.getAll(constraints);
      
      if (remoteAssets && remoteAssets.length > 0) {
        await db.assets.bulkPut(remoteAssets);
        localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
      } else {
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
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
      
      // Throttle: 30 seconds for active chat sync
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 30000) {
        return;
      }

      const constraints: any[] = [];
      if (lastSyncStr) {
        // Delta sync
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10) - 60000)));
      }

      // Try chatId first, then orderId
      let remoteMessages = await messageRepository.getAll([where('chatId', '==', id), ...constraints]);
      
      if (!remoteMessages || remoteMessages.length === 0) {
        remoteMessages = await messageRepository.getAll([where('orderId', '==', id), ...constraints]);
      }

      if (remoteMessages && remoteMessages.length > 0) {
        await db.messages.bulkPut(remoteMessages);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error(`Sync messages failed for ${id}:`, error);
    }
  },

  async syncUsers(merchantId: string, force: boolean = false) {
    if (!(await this.isOnline(merchantId, force))) return;
    try {
      const lastSyncKey = `last_sync_users_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Strict Throttle: 5 minutes between user list syncs (unless forced)
      if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 300000) {
        return;
      }

      const constraints: any[] = [];
      
      if (merchantId && merchantId !== 'global') {
        constraints.push(where('merchant_id', '==', merchantId));
      }
      
      if (lastSyncStr) {
        constraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // Initial sync: last 7 days for users to be really aggressive on quota
        constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 7)));
      }

      console.log(`Syncing users... ${lastSyncStr ? '(Delta)' : '(Initial 7d)'}`);
      const remoteUsers = await userRepository.getAll(constraints);
      
      const allUsersToSync = [...remoteUsers];

      if (allUsersToSync.length > 0) {
        await db.users.bulkPut(allUsersToSync);
        localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
      } else {
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
    } catch (error) {
      console.error('Sync users failed:', error);
    }
  },

  async syncSaaSCollection(merchantId: string, collectionName: string, localTable: any, force: boolean = false) {
    if (!(await this.isOnline(merchantId, force))) return;
    try {
      const lastSyncKey = `last_sync_${collectionName}_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle: 30 minutes for SaaS data unless forced
      if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 1800000) {
        return;
      }

      const timeConstraints: any[] = [];
      if (!force && lastSyncStr) {
        timeConstraints.push(where('updated_at', '>=', new Date(parseInt(lastSyncStr, 10))));
      }

      console.log(`Syncing ${collectionName}... ${!force && lastSyncStr ? '(Delta)' : '(Full Sync)'}`);
      
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = collectionName;
      })();
      
      let remoteData: any[] = [];
      const mId = merchantId || 'global';

      if (mId !== 'global') {
        try {
          remoteData = await repo.getAll([where('merchant_id', '==', mId), ...timeConstraints]);
        } catch (err1) {
          console.warn(`[sync] merchant_id query failed for ${collectionName}, trying merchantId fallback`);
        }
        if (!remoteData || remoteData.length === 0) {
          try {
            remoteData = await repo.getAll([where('merchantId', '==', mId), ...timeConstraints]);
          } catch (err2) {
            console.warn(`[sync] merchantId query failed for ${collectionName}`);
          }
        }
        
        // Final fallback if both fail but we really need it
        if (!remoteData || remoteData.length === 0) {
           try {
             // Try without updated_at constraint if it failed because of missing composite index
             console.log(`[sync] Trying without time constraints for ${collectionName}...`);
             remoteData = await repo.getAll([where('merchantId', '==', mId)]);
           } catch (err3) {
           }
        }
      } else {
        remoteData = await repo.getAll([...timeConstraints]);
      }

      if (remoteData && remoteData.length > 0) {
        // Map data if needed (standardize merchantId)
        const mappedData = remoteData.map((d: any) => ({
          ...d,
          merchantId: d.merchant_id || d.merchantId
        }));
        setRemoteSyncState(true);
        try {
          await localTable.bulkPut(mappedData);
        } finally {
          setRemoteSyncState(false);
        }
        localStorage.setItem(lastSyncKey, (Date.now() - 60000).toString());
      } else {
        localStorage.setItem(lastSyncKey, Date.now().toString());
      }
    } catch (error) {
      console.error(`Sync ${collectionName} failed:`, error);
    }
  },

  async syncSchoolPortalData(merchantId: string, force: boolean = false) {
    const collections = [
      { name: 'students', table: db.students },
      { name: 'teachers', table: db.teachers },
      { name: 'classes', table: db.classes },
      { name: 'subjects', table: db.subjects },
      { name: 'grades', table: db.grades },
      { name: 'parents', table: db.parents },
      { name: 'attendance', table: db.attendance },
      { name: 'communications', table: db.communications },
      { name: 'ai_insights', table: db.ai_insights },
      { name: 'schedules', table: db.schedules },
      { name: 'homeworks', table: db.homeworks },
      { name: 'discipline_records', table: db.discipline_records }
    ];
    
    for (const col of collections) {
      await this.syncSaaSCollection(merchantId, col.name, col.table, force);
    }
  },

  async syncStudentData(merchantId: string, studentId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      console.log(`Targeted sync for student ${studentId}...`);
      
      const firestore = (await import('../firebase')).db;
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { restoreFromFirestore } = await import('../lib/firestore.utils');

      // Fetch specific student data from massive collections to save quota
      try {
        const queries = [
          { name: 'grades', q: query(collection(firestore, 'grades'), where('studentId', '==', studentId)) },
          { name: 'attendance', q: query(collection(firestore, 'attendance'), where('studentId', '==', studentId)) },
          { name: 'discipline_records', q: query(collection(firestore, 'discipline_records'), where('studentId', '==', studentId)) }
        ];
        
        for (const {name, q} of queries) {
           const snap = await getDocs(q);
           if (!snap.empty) {
             const items = snap.docs.map(d => restoreFromFirestore({ id: d.id, ...d.data() }));
             await (db as any)[name].bulkPut(items);
           }
        }
      } catch(err) {
        console.warn("Targeted sub-collection sync failed for student", err);
      }
      
      const collections = [
        { name: 'merchants', table: db.merchants },
        { name: 'students', table: db.students },
        { name: 'classes', table: db.classes },
        { name: 'subjects', table: db.subjects },
        { name: 'schedules', table: db.schedules },
        { name: 'homeworks', table: db.homeworks },
        { name: 'teachers', table: db.teachers },
        { name: 'communications', table: db.communications }
      ];
      
      for (const col of collections) {
        await this.syncSaaSCollection(merchantId, col.name, col.table, false); // DELTA SYNC ONLY
      }

      console.log("Student targeted sync complete");
    } catch (e) {
      console.error("Targeted student sync failed", e);
    }
  },

  async syncParentData(merchantId: string, parentId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      console.log(`Targeted sync for parent ${parentId}...`);

      const collections = [
        { name: 'merchants', table: db.merchants },
        { name: 'parents', table: db.parents },
        { name: 'classes', table: db.classes },
        { name: 'subjects', table: db.subjects },
        { name: 'schedules', table: db.schedules },
        { name: 'homeworks', table: db.homeworks },
        { name: 'teachers', table: db.teachers },
        { name: 'students', table: db.students },
        { name: 'attendance', table: db.attendance },
        { name: 'grades', table: db.grades },
        { name: 'communications', table: db.communications }
      ];
      
      for (const col of collections) {
        await this.syncSaaSCollection(merchantId, col.name, col.table, false); // DELTA SYNC ONLY to prevent quota exhaustion
      }

      console.log("Parent targeted sync complete");
    } catch (e) {
      console.error("Targeted parent sync failed", e);
    }
  },

  async syncTeacherData(merchantId: string, teacherId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      console.log(`Targeted sync for teacher ${teacherId}...`);
      
      const collections = [
        { name: 'merchants', table: db.merchants },
        { name: 'teachers', table: db.teachers },
        { name: 'classes', table: db.classes },
        { name: 'subjects', table: db.subjects },
        { name: 'schedules', table: db.schedules },
        { name: 'homeworks', table: db.homeworks },
        { name: 'students', table: db.students },
        { name: 'grades', table: db.grades },
        { name: 'attendance', table: db.attendance },
        { name: 'discipline_records', table: db.discipline_records },
        { name: 'communications', table: db.communications }
      ];
      
      for (const col of collections) {
        await this.syncSaaSCollection(merchantId, col.name, col.table, false); // DELTA SYNC ONLY to prevent quota exhaustion
      }

      console.log("Teacher targeted sync complete");
    } catch (e) {
      console.error("Targeted teacher sync failed", e);
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
      { name: 'stock_movements', table: db.movements },
      { name: 'merchant_categories', table: db.categories },
      { name: 'teachers', table: db.teachers },
      { name: 'classes', table: db.classes },
      { name: 'subjects', table: db.subjects },
      { name: 'grades', table: db.grades },
      { name: 'parents', table: db.parents },
      { name: 'attendance', table: db.attendance },
      { name: 'communications', table: db.communications },
      { name: 'ai_insights', table: db.ai_insights },
      { name: 'schedules', table: db.schedules },
      { name: 'homeworks', table: db.homeworks },
      { name: 'discipline_records', table: db.discipline_records }
    ];
    
    for (const col of collections) {
      await this.syncSaaSCollection(merchantId, col.name, col.table);
    }
  },

  async syncCategories(merchantId: string) {
    await this.syncSaaSCollection(merchantId, 'merchant_categories', db.categories);
  },

  async syncNotifications(userId: string) {
    if (!(await this.isOnline()) || !userId) return;
    try {
      const lastSyncKey = `last_sync_notifications_${userId}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      // Throttle: 1 minute between notification syncs
      if (lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 60000) {
        return;
      }

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
      localStorage.setItem(lastSyncKey, Date.now().toString());
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
      
      // 0. Push Merchant Profile
      try {
        const localMerchant = await db.merchants.get(merchantId);
        if (localMerchant) {
           const { merchantRepository } = await import('../data/repositories/merchant.repository');
           await merchantRepository.update(merchantId, localMerchant as any).catch(async () => {
             // If it doesn't exist, create it
             await merchantRepository.create({ ...localMerchant, id: merchantId } as any);
           });
        }
      } catch (e) {
        console.warn('Failed to push merchant profile:', e);
      }

      // 1. Pending Sales
      const pendingSales = await db.sales.where('syncStatus').anyOf('pending', 'local-only').toArray();
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
      const pendingProducts = await db.products.where('syncStatus').anyOf('pending', 'local-only').toArray();
      for (const product of pendingProducts) {
        try {
          const { syncStatus, ...data } = product as any;
          const { merchantProductRepository } = await import('../data/repositories/merchant-product.repository');
          if (product.id && product.id.length > 20) { // Assume it already exists if long ID
             await merchantProductRepository.update(product.id, data).catch(async () => {
               await merchantProductRepository.create({ ...data, id: product.id } as any);
             });
          } else {
             await merchantProductRepository.create(data as any);
          }
          await db.products.update(product.id, { syncStatus: 'synced' } as any);
        } catch (e) {
          console.warn('Failed to push pending product:', product.id);
        }
      }

      // 3. Pending Expenses
      const pendingExpenses = await db.expenses.where('syncStatus').anyOf('pending', 'local-only').toArray();
      for (const expense of pendingExpenses) {
        try {
          const { syncStatus, ...data } = expense as any;
          const { merchantExpenseRepository } = await import('../data/repositories/merchant-expense.repository');
          if (expense.id && expense.id.length > 20) {
             await merchantExpenseRepository.update(expense.id, data).catch(async () => {
               await merchantExpenseRepository.create({ ...data, id: expense.id } as any);
             });
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

  async pushSchoolPortalData(merchantId: string) {
    if (!(await this.isOnline(merchantId))) return;
    try {
      console.log(`Pushing local school data for merchant ${merchantId} to firestore...`);
      const { firestoreService } = await import('./firestoreService');
      
      const educationalTables = [
        { name: 'classes', table: db.classes },
        { name: 'subjects', table: db.subjects },
        { name: 'grades', table: db.grades },
        { name: 'attendance', table: db.attendance },
        { name: 'communications', table: db.communications },
        { name: 'ai_insights', table: db.ai_insights },
        { name: 'schedules', table: db.schedules },
        { name: 'homeworks', table: db.homeworks },
        { name: 'discipline_records', table: db.discipline_records },
        { name: 'students', table: db.students },
        { name: 'teachers', table: db.teachers },
        { name: 'parents', table: db.parents }
      ];

      for (const col of educationalTables) {
        try {
          const items = await col.table.where('merchantId').equals(merchantId).toArray();
          console.log(`[pushSchoolPortalData] Found ${items.length} local items in ${col.name} to upload`);
          
          for (const item of items) {
            const dataToSave = {
              ...item,
              merchantId,
              merchant_id: merchantId
            };
            if (item.id) {
              await firestoreService.save(col.name, dataToSave);
            }
          }
        } catch (tableErr) {
          console.error(`Failed to push local ${col.name} table:`, tableErr);
        }
      }
      console.log('Local school portal data push completed.');
    } catch (err) {
      console.error('Error during pushSchoolPortalData:', err);
    }
  },

  async syncActivities(merchantId?: string, force: boolean = false) {
    if (!(await this.isOnline(merchantId, force))) return;
    try {
      const lastSyncKey = `last_sync_activities_${merchantId || 'global'}`;
      const lastSyncStr = localStorage.getItem(lastSyncKey);
      
      if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < 600000) { // 10 min throttle
        return;
      }

      console.log(`Syncing activities... ${lastSyncStr ? '(Delta)' : '(Initial 7d)'}`);
      const constraints: any[] = [orderBy('createdAt', 'desc'), limit(100)];
      
      if (lastSyncStr) {
        constraints.push(where('createdAt', '>=', new Date(parseInt(lastSyncStr, 10))));
      } else {
        // First sync: only last 7 days to avoid huge fetch
        constraints.push(where('createdAt', '>=', new Date(Date.now() - 86400000 * 7)));
      }

      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<Activity> {
        protected collectionName = 'activities';
      })();

      const remoteActivities = await repo.getAll(constraints);
      if (remoteActivities && remoteActivities.length > 0) {
        await db.activities.bulkPut(remoteActivities);
      }
      localStorage.setItem(lastSyncKey, Date.now().toString());
    } catch (error) {
      console.error('Sync activities failed:', error);
    }
  },

  async syncStudioAcomData(userId?: string, isAdmin: boolean = false, force: boolean = false) {
    if (!(await this.isOnline(navigator.onLine ? undefined : 'offline', force))) return;
    
    // Global lock to prevent concurrent syncs
    const globalSyncLockKey = 'sync_studio_acom_active';
    if (sessionStorage.getItem(globalSyncLockKey) && !force) return;
    
    try {
      sessionStorage.setItem(globalSyncLockKey, 'true');
      console.log(`Syncing Studio Acom data... ${force ? '(Forced)' : ''}`);
      
      const collections = [
        { name: 'studio_acom_categories', table: db.studio_acom_categories, throttleMs: 600000 }, 
        { name: 'studio_acom_products', table: db.studio_acom_products, throttleMs: 600000 },
        { name: 'variants', table: db.variants, throttleMs: 600000 },
        { name: 'design_requests', table: db.design_requests, requiresAuth: true, throttleMs: 30000 }
      ];

      for (const col of collections) {
        const lastSyncKey = `last_sync_${col.name}_${col.requiresAuth && !isAdmin ? userId : 'global'}`;
        const lastSyncStr = localStorage.getItem(lastSyncKey);
        
        // Skip if recently synced (unless forced)
        if (!force && lastSyncStr && Date.now() - parseInt(lastSyncStr, 10) < col.throttleMs) {
          continue;
        }

        const constraints: any[] = [];
        if (col.requiresAuth && !isAdmin && userId) {
           constraints.push(where('userId', '==', userId));
        }

        if (lastSyncStr && !force) {
          const lastSyncDate = new Date(parseInt(lastSyncStr, 10));
          // On recule de 10 min
          const safeDate = new Date(lastSyncDate.getTime() - 600000);
          constraints.push(where('updated_at', '>=', safeDate));
          constraints.push(orderBy('updated_at', 'desc'));
          // Limit delta syncs
          constraints.push(limit(250));
        } else {
          // If forced or initial: 90 days to catch more requests for admin
          constraints.push(where('updated_at', '>=', new Date(Date.now() - 86400000 * 90)));
          constraints.push(orderBy('updated_at', 'desc'));
          constraints.push(limit(500)); 
        }

        const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
          protected collectionName = col.name;
        })();
        
        try {
          console.log(`[syncStudioAcom] Syncing ${col.name} (force=${force})...`);
          const remoteData = await repo.getAll(constraints);
          console.log(`[syncStudioAcom] Received ${remoteData?.length || 0} items for ${col.name}`);
          
          if (remoteData && remoteData.length > 0) {
            await col.table.bulkPut(remoteData);
          }
          localStorage.setItem(lastSyncKey, (Date.now() - 600000).toString()); // 10 min overlap
        } catch (e) {
          console.warn(`Sync failed for collection ${col.name}:`, e);
        }
      }
    } catch (error) {
      console.error('Sync Studio Acom data failed:', error);
    } finally {
      sessionStorage.removeItem(globalSyncLockKey);
    }
  },
};
