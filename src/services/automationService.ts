import { Order, UserProfile, MerchantProduct } from '../types';
import { dbService } from './dbService';
import { notificationService } from './notificationService';
import { subHours, isBefore } from 'date-fns';
import { merchantProductRepository } from '../data/repositories/merchant-product.repository';
import { where } from 'firebase/firestore';

export const automationService = {
  async runProactiveChecks(orders: Order[], users: UserProfile[]) {
    console.log('Running proactive automation checks...');
    
    // 1. Check for orders confirmed but not paid for > 24h
    const now = new Date();
    const threshold = subHours(now, 24);

    const forgottenOrders = orders.filter(order => 
      order.status === 'confirmed' && 
      !order.paid && 
      order.createdAt && 
      isBefore(new Date(order.createdAt), threshold)
    );

    for (const order of forgottenOrders) {
      console.log(`Found forgotten order: ${order.id}. Sending reminder...`);
      const client = users.find(u => u.uid === order.userId || u.uid === order.user_id) || null;
      
      if (client) {
        await notificationService.notifyStatusChange(order, 'confirmed', client);
      }
    }

    // 2. Proactive Stock Check
    await this.runStockReplenishmentChecks();
  },

  async runStockReplenishmentChecks() {
    console.log('Running proactive stock replenishment checks...');
    try {
      // Fetch all products that are below threshold
      // For a robust implementation, you would query only active merchants
      const allProducts = await merchantProductRepository.getAll([]);
      
      const lowStockProducts = allProducts.filter(p => {
        const stock = p.stockQuantity || (p as any).stock_quantity || 0;
        const minLevel = p.minStockLevel || (p as any).min_stock_level || 5;
        return stock <= minLevel;
      });

      for (const product of lowStockProducts) {
        console.log(`Low stock detected for product: ${product.name}`);
        
        // 1. Notify Admin
        await notificationService.notifyLowStock(
          product.name, 
          product.stockQuantity || (product as any).stock_quantity || 0,
          product.minStockLevel || (product as any).min_stock_level || 5
        );

        // 2. Proactive Reorder
        if (product.supplierId) {
          console.log(`Auto-triggering reorder for product ${product.name} from supplier ${product.supplierId}`);
          await this.createPurchaseOrder(product);
        }
      }
    } catch (e) {
      console.error("Error in stock replenishment checks", e);
    }
  },

  async createPurchaseOrder(product: MerchantProduct) {
    // Basic implementation: Log the intent to reorder
    console.log(`Creating purchase order for product ${product.id} from supplier ${product.supplierId}`);
    // In a production system, you'd insert into a 'purchase_orders' collection
    // and notify the supplier via email or API.
  }
};
