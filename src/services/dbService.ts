import { auth } from '../firebase';
import { where, orderBy, limit } from 'firebase/firestore';
import { Service, PortfolioItem, BlogPost, UserProfile, Order, Design, Expense, Merchant, MerchantProduct, MerchantSale, MerchantExpense, MerchantSupplier, StockMovement, ServiceIntervention, ConstructionProject, TransportVehicle, HREmployee, SchoolStudent, MedicalPatient, MedicalAppointment, PartnerRating } from '../types';
import { serviceRepository } from '../data/repositories/service.repository';
import { orderRepository } from '../data/repositories/order.repository';
import { portfolioRepository } from '../data/repositories/portfolio.repository';
import { blogRepository } from '../data/repositories/blog.repository';
import { messageRepository } from '../data/repositories/message.repository';
import { expenseRepository } from '../data/repositories/expense.repository';
import { notificationRepository } from '../data/repositories/notification.repository';
import { userRepository } from '../data/repositories/user.repository';
import { merchantRepository } from '../data/repositories/merchant.repository';
import { merchantProductRepository } from '../data/repositories/merchant-product.repository';
import { merchantSaleRepository } from '../data/repositories/merchant-sale.repository';
import { merchantExpenseRepository } from '../data/repositories/merchant-expense.repository';
import { merchantSupplierRepository } from '../data/repositories/merchant-supplier.repository';
import { stockMovementRepository } from '../data/repositories/stock-movement.repository';
import { interventionRepository } from '../data/repositories/intervention.repository';
import { projectRepository } from '../data/repositories/project.repository';
import { vehicleRepository } from '../data/repositories/vehicle.repository';
import { employeeRepository } from '../data/repositories/employee.repository';
import { studentRepository } from '../data/repositories/student.repository';
import { patientRepository } from '../data/repositories/patient.repository';
import { appointmentRepository } from '../data/repositories/appointment.repository';
import { designRepository } from '../data/repositories/design.repository';
import { designBlockRepository } from '../data/repositories/design-block.repository';
import { categoryRepository } from '../data/repositories/category.repository';
import { studioAcomProductRepository } from '../data/repositories/studio-acom-product.repository';
import { variantRepository } from '../data/repositories/variant.repository';
import { partnerRatingRepository } from '../data/repositories/partner-rating.repository';
import { assetRepository } from '../data/repositories/asset.repository';
import { templateRepository } from '../data/repositories/template.repository';
import { designRequestRepository } from '../data/repositories/design-request.repository';
import { activityService } from './activityService';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db';

export const dbService = {
  services: {
    async getById(id: string) {
      return serviceRepository.getById(id);
    },
    async save(service: Partial<Service>) {
      if (service.id) {
        await serviceRepository.update(service.id, service);
        await db.services.update(service.id, service);
        return;
      }
      const id = await serviceRepository.create(service as any);
      await db.services.put({ ...service, id } as any);
      return id;
    },
    async delete(id: string) {
      await serviceRepository.delete(id);
      await db.services.delete(id);
    }
  },
  orders: {
    async getById(id: string) {
      return orderRepository.getById(id);
    },
    async save(order: Partial<Order>) {
      if (order.id) {
        const result = await orderRepository.update(order.id, order);
        
        // Update local Dexie db for immediate reactivity
        await db.orders.update(order.id, order);

        await activityService.log({
          type: 'order_updated',
          entityId: order.id,
          entityType: 'order',
          message: `Commande mise à jour: ${order.status || 'statut inconnu'}`,
          metadata: { status: order.status }
        });
        return result;
      }
      const id = await orderRepository.create(order as any);
      
      // Save full order with id in Dexie
      await db.orders.put({ ...order, id, createdAt: order.createdAt || new Date() } as any);

      await activityService.log({
        type: 'order_created',
        entityId: id,
        entityType: 'order',
        message: `Nouvelle commande créée`,
        metadata: { totalPrice: order.totalPrice }
      });
      return id;
    }
  },
  portfolio: {
    async save(item: Partial<PortfolioItem>) {
      if (item.id) {
        await portfolioRepository.update(item.id, item);
        await db.portfolio_items.update(item.id, item);
        return;
      }
      const id = await portfolioRepository.create(item as any);
      await db.portfolio_items.put({ ...item, id: id } as any);
      return id;
    },
    async delete(id: string) {
      await portfolioRepository.delete(id);
      await db.portfolio_items.delete(id);
    }
  },
  blog: {
    async getById(id: string) {
      return blogRepository.getById(id);
    },
    async getRelated(category: string, excludeId: string, limitCount: number = 2) {
      return blogRepository.getAll([
        where('category', '==', category),
        where('id', '!=', excludeId),
        limit(limitCount)
      ]);
    },
    async save(post: Partial<BlogPost>) {
      if (post.id) {
        await blogRepository.update(post.id, post);
        await db.blog_posts.update(post.id, post);
        return;
      }
      const id = await blogRepository.create(post as any);
      await db.blog_posts.put({ ...post, id: id } as any);
      return id;
    },
    async delete(id: string) {
      await blogRepository.delete(id);
      await db.blog_posts.delete(id);
    }
  },
  settings: {
    async save(id: string, settingsData: any) {
      // Settings are a bit special, usually a single doc per type
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'settings';
      })();
      return repo.update(id, { data: settingsData });
    },
    async get(id: string) {
      const repo = new (class extends (await import('../data/repositories/base.repository')).BaseRepository<any> {
        protected collectionName = 'settings';
      })();
      const settings = await repo.getById(id);
      return settings?.data || settings;
    }
  },
  messages: {
    async save(message: any) {
      const id = await messageRepository.create(message);
      await db.messages.put({ ...message, id, createdAt: message.createdAt || new Date() });
      return id;
    },
    async list(options: any) {
      if (options.where) {
        const chatIdFilter = options.where.find((w: any) => w[0] === 'chatId');
        if (chatIdFilter) {
          return db.messages.where('chatId').equals(chatIdFilter[2]).sortBy('timestamp');
        }
        
        // Fallback or generic filter
        const filters = options.where.map((f: any) => where(f[0], f[1], f[2]));
        const sorts = options.orderBy ? options.orderBy.map((s: any) => orderBy(s[0], s[1])) : [];
        const limitRes = options.limit ? [limit(options.limit)] : [];
        return messageRepository.getAll([...filters, ...sorts, ...limitRes]);
      }
      return db.messages.toArray();
    }
  },
  contactMessages: {
    async save(message: any) {
      return messageRepository.create(message);
    }
  },
  expenses: {
    async save(expense: Partial<Expense>) {
      if (expense.id) {
        return expenseRepository.update(expense.id, expense);
      }
      return expenseRepository.create(expense as any);
    },
    async delete(id: string) {
      return expenseRepository.delete(id);
    },
    async getAll(limitCount: number = 100) {
      return expenseRepository.getAll([
        orderBy('date', 'desc'),
        limit(limitCount)
      ]);
    }
  },
  notifications: {
    async save(notification: any) {
      if (notification.id) {
        return notificationRepository.update(notification.id, notification);
      }
      return notificationRepository.create(notification);
    },
    async markAsRead(id: string) {
      return notificationRepository.update(id, { read: true } as any);
    }
  },
  studioAcom: {
    categories: {
      async getAll() {
        return categoryRepository.getAll([orderBy('name', 'asc')]);
      },
      async save(category: any) {
        const data = {
          name: category.name,
          sub: category.sub || '',
          icon: typeof category.icon === 'string' ? category.icon : (category.iconName || 'LayoutGrid'),
          color: category.color || 'text-primary',
          cover_image: category.coverImage || category.cover_image || '',
        };
        
        let id = category.id;
        if (id) {
          await categoryRepository.update(id, data);
        } else {
          id = await categoryRepository.create(data as any);
        }
        
        // Update local Dexie for immediate feedback
        await db.studio_acom_categories.put({ ...data, id });
        return id;
      },
      async delete(id: string) {
        await categoryRepository.delete(id);
        await db.studio_acom_categories.delete(id);
      }
    },
    products: {
      async getAll() {
        return studioAcomProductRepository.getAll([orderBy('name', 'asc')]);
      },
      async save(product: any) {
        const { variants, ...productData } = product;
        const data = {
          name: productData.name,
          category_id: productData.categoryId || productData.category_id,
          description: productData.description || '',
          cover_image: productData.coverImage || productData.cover_image || '',
          user_id: productData.userId || '',
        };
        
        let id = productData.id;
        if (id) {
          await studioAcomProductRepository.update(id, data);
        } else {
          id = await studioAcomProductRepository.create(data as any);
        }

        // Save variants
        if (variants && Array.isArray(variants)) {
          // ... existing variant logic ...
          const existingVariants = await variantRepository.getAll([where('product_id', '==', id)]);
          const existingVariantIds = existingVariants.map(v => v.id);
          const incomingVariantIds = variants.filter(v => v.id && v.id.length > 5).map(v => v.id);

          const toDelete = existingVariants.filter(v => !incomingVariantIds.includes(v.id));
          for (const v of toDelete) {
            await variantRepository.delete(v.id);
            await db.variants.delete(v.id); // Update Dexie
          }

          for (const variant of variants) {
            const variantData = {
              product_id: id,
              name: variant.name,
              size: variant.size || '',
              color: variant.color || '',
              shape: variant.shape || '',
              format: variant.format || 'landscape',
              finish: variant.finish || '',
              template_id: variant.templateId || variant.template_id || '',
              preview_image: variant.previewImage || variant.preview_image || '',
              price: Number(variant.price) || 0,
              min_quantity: Number(variant.minQuantity || variant.min_quantity) || 1,
              max_quantity: Number(variant.maxQuantity || variant.max_quantity) || 1000,
              template_svg: variant.templateSvg || variant.template_svg || '',
            };

            if (variant.id && variant.id.length > 5 && existingVariantIds.includes(variant.id)) {
              await variantRepository.update(variant.id, variantData as any);
              await db.variants.update(variant.id, variantData); // Update Dexie
            } else {
              const vid = await variantRepository.create(variantData as any);
              await db.variants.put({ ...variantData, id: vid }); // Update Dexie
            }
          }
        }
        
        // Update local Dexie product for immediate feedback
        await db.studio_acom_products.put({ ...data, id });
        return id;
      },
      async delete(id: string) {
        // Delete variants first
        const variants = await variantRepository.getAll([where('product_id', '==', id)]);
        for (const v of variants) {
          await variantRepository.delete(v.id);
          await db.variants.delete(v.id);
        }
        await studioAcomProductRepository.delete(id);
        await db.studio_acom_products.delete(id);
      },
      async getVariants(productId: string) {
        return variantRepository.getAll([
          where('product_id', '==', productId)
        ]);
      }
    }
  },
  users: {
    async getById(id: string) {
      return userRepository.getById(id);
    },
    async save(user: Partial<UserProfile>) {
      if (user.uid) {
        // For users, we use uid as doc id
        const repo = userRepository;
        const exists = await repo.getById(user.uid);
        if (exists) {
          return repo.update(user.uid, user);
        } else {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          await setDoc(doc(db, 'users', user.uid), {
            ...user,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
          return user.uid;
        }
      }
      return '';
    },
    async update(id: string, user: Partial<UserProfile>) {
      return userRepository.update(id, user);
    },
    async delete(id: string) {
      return userRepository.delete(id);
    }
  },
  merchants: {
    async getByOwner(ownerId: string) {
      try {
        // First try with owner_id (snake_case)
        let merchants = await merchantRepository.getAll([
          where('owner_id', '==', ownerId)
        ]);

        // If nothing found, try with ownerId (camelCase)
        if (merchants.length === 0) {
          merchants = await merchantRepository.getAll([
            where('ownerId', '==', ownerId)
          ]);
        }
        
        // Sort in-memory if needed, but usually there's only one
        if (merchants.length > 1) {
          merchants.sort((a: any, b: any) => {
            const dateA = a.created_at || a.createdAt || 0;
            const dateB = b.created_at || b.createdAt || 0;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
        }

        return merchants.length > 0 ? merchants[0] : null;
      } catch (error) {
        console.error('Error fetching merchant by owner:', error);
        // If it's a permission or index error, we assume no merchant found yet to allow onboarding
        return null;
      }
    },
    async save(merchant: Partial<Merchant>) {
      const data = {
        ...merchant,
        ownerId: merchant.ownerId,
        updatedAt: new Date()
      };
      let id = merchant.id || uuidv4();
      
      // Always attempt cloud save for merchants to sync licenses
      try {
        if (merchant.id) {
          await merchantRepository.update(merchant.id, data);
          id = merchant.id;
        } else {
          id = await merchantRepository.create(data as any);
        }
      } catch (error) {
        console.warn('Merchant cloud save failed, keeping local');
        id = merchant.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      
      if (id) {
        const finalId = id;
        await db.merchants.put({ ...data, id: finalId, updatedAt: new Date() } as any);
        
        if (!merchant.id) {
          await activityService.log({
            type: 'merchant_created',
            entityId: finalId,
            entityType: 'merchant',
            merchantId: finalId,
            message: `Nouveau marchand créé: ${merchant.name}`
          });
        }
        return finalId;
      }
      return id;
    },
    async get(id: string) {
      return db.merchants.get(id);
    }
  },
  merchantProducts: {
    async save(product: Partial<MerchantProduct>) {
      const user = auth.currentUser;
      const data = {
        ...product,
        owner_id: user?.uid,
        ownerId: user?.uid,
        updatedAt: new Date(),
        syncStatus: 'synced'
      };
      
      let id = product.id || uuidv4();
      const merchantId = product.merchantId || (product as any).merchant_id;
      const merchant = merchantId ? await db.merchants.get(merchantId) : null;
      
      if (merchant?.licenseType !== 'local') {
        try {
          if (product.id) {
            await merchantProductRepository.update(product.id, data);
          } else {
            const remoteId = await merchantProductRepository.create(data as any);
            id = remoteId;
          }
        } catch (error) {
          console.warn('Product cloud sync failed, saving locally');
          data.syncStatus = 'pending';
        }
      } else {
        data.syncStatus = 'local-only';
      }

      await db.products.put({ ...data, id } as any);
      
      // Phase 3: SQLite Mirroring for Local/Heavy data
      try {
        const { sqliteHelper } = await import('./sqliteService');
        await sqliteHelper.insertProduct({ ...data, id });
      } catch (e) {
        console.warn('SQLite mirroring failed:', e);
      }
      
      return id;
    },
    async delete(id: string) {
      await merchantProductRepository.delete(id);
      await db.products.delete(id);
    }
  },
  merchantSales: {
    async save(sale: any) {
      const user = auth.currentUser;
      const data = {
        ...sale,
        owner_id: user?.uid,
        ownerId: user?.uid,
        updatedAt: new Date(),
        syncStatus: 'synced'
      };
      
      let id = sale.id || uuidv4();
      
      try {
        // Try to save to Cloud
        const remoteId = await merchantSaleRepository.create(data);
        id = remoteId;
      } catch (error) {
        console.warn('Cloud save failed (Quota or Offline), saving locally only:', error);
        data.syncStatus = 'pending';
        // Auto-flag quota exceeded to quiet the sync engine temporarily
        if (error instanceof Error && error.message.includes('Quota exceeded')) {
          localStorage.setItem('firebase_quota_exceeded', Date.now().toString());
        }
      }

      // ALWAYS Update local Dexie for reliability
      await db.sales.put({ ...data, id, createdAt: sale.createdAt || new Date() } as any);

      // Phase 3: SQLite Mirroring
      try {
        const { sqliteHelper } = await import('./sqliteService');
        await sqliteHelper.insertSale({ ...data, id });
      } catch (e) {
        console.warn('SQLite mirroring for sale failed:', e);
      }

      // Record stock movements locally and attempt cloud update for each
      for (const item of sale.items) {
        try {
          const product = await merchantProductRepository.getById(item.productId);
          if (product) {
            const newStock = Math.max(0, (product.stockQuantity || (product as any).stock_quantity || 0) - item.quantity);
            await merchantProductRepository.update(item.productId, { stockQuantity: newStock } as any);
            await db.products.update(item.productId, { stockQuantity: newStock, updatedAt: new Date() });
          }
        } catch (e) {
          console.warn('Stock sync delayed due to connection/quota');
        }
      }

      await activityService.log({
        type: 'payment_received',
        entityId: id,
        entityType: 'sale',
        merchantId: sale.merchantId || sale.merchant_id,
        message: `Vente enregistrée en local: ${(sale.totalAmount || sale.total_amount).toLocaleString()} FCFA`,
        metadata: { amount: sale.totalAmount || sale.total_amount, offline: data.syncStatus === 'pending' }
      });

      return id;
    }
  },
  merchantExpenses: {
    async save(expense: Partial<MerchantExpense>) {
      const user = auth.currentUser;
      const data = {
        ...expense,
        owner_id: user?.uid,
        ownerId: user?.uid,
        updatedAt: new Date(),
        syncStatus: 'synced'
      };
      
      let id = expense.id || uuidv4();
      const merchantId = expense.merchantId || (expense as any).merchant_id;
      const merchant = merchantId ? await db.merchants.get(merchantId) : null;

      if (merchant?.licenseType !== 'local') {
        try {
          if (expense.id) {
            await merchantExpenseRepository.update(expense.id, data);
          } else {
            const remoteId = await merchantExpenseRepository.create(data as any);
            id = remoteId;
          }
        } catch (error) {
          console.warn('Expense cloud sync failed, saving locally');
          data.syncStatus = 'pending';
        }
      } else {
        data.syncStatus = 'local-only';
      }

      await db.expenses.put({ ...data, id, createdAt: expense.createdAt || new Date() } as any);

      // Phase 3: SQLite Mirroring
      try {
        const { sqliteHelper } = await import('./sqliteService');
        await sqliteHelper.insertExpense({ ...data, id });
      } catch (e) {
        console.warn('SQLite mirroring for expense failed:', e);
      }
      
      return id;
    },
    async delete(id: string) {
      await merchantExpenseRepository.delete(id);
      await db.expenses.delete(id);
    }
  },
  merchantSuppliers: {
    async save(supplier: Partial<MerchantSupplier>) {
      const user = auth.currentUser;
      const data = {
        ...supplier,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = supplier.id;
      if (supplier.id) {
        await merchantSupplierRepository.update(supplier.id, data);
      } else {
        id = await merchantSupplierRepository.create(data as any);
      }
      await db.suppliers.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await merchantSupplierRepository.delete(id);
      await db.suppliers.delete(id);
    }
  },
  stockMovements: {
    async addStock(merchantId: string, productId: string, quantity: number, reason: string, performedBy: string, cost?: number) {
      const product = await merchantProductRepository.getById(productId);
      if (!product) throw new Error('Produit non trouvé');

      const currentStock = product.stockQuantity || (product as any).stock_quantity || 0;
      const newStock = currentStock + quantity;

      await merchantProductRepository.update(productId, { stockQuantity: newStock } as any);
      // Update local product
      await db.products.update(productId, { stockQuantity: newStock, updatedAt: new Date() });

      const user = auth.currentUser;
      const movementId = await stockMovementRepository.create({
        merchantId,
        owner_id: user?.uid,
        ownerId: user?.uid,
        productId,
        type: 'in',
        quantity,
        previousQuantity: currentStock,
        newQuantity: newStock,
        reason,
        performedBy
      } as any);
      // Update local movement
      await db.movements.put({
        id: movementId,
        merchantId,
        productId,
        type: 'in',
        quantity,
        previousQuantity: currentStock,
        newQuantity: newStock,
        reason,
        performedBy,
        createdAt: new Date()
      });

      if (cost && cost > 0) {
        const expenseId = await merchantExpenseRepository.create({
          merchantId,
          owner_id: user?.uid,
          ownerId: user?.uid,
          title: `Approvisionnement: ${product.name}`,
          amount: cost,
          category: 'Stock',
          date: new Date().toISOString().split('T')[0]
        } as any);
        // Update local expense
        await db.expenses.put({
          id: expenseId,
          merchantId,
          title: `Approvisionnement: ${product.name}`,
          amount: cost,
          category: 'Stock',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date()
        });
      }
    }
  },
  interventions: {
    async save(intervention: Partial<ServiceIntervention>) {
      const user = auth.currentUser;
      const data = {
        ...intervention,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = intervention.id;
      if (intervention.id) {
        await interventionRepository.update(intervention.id, data);
      } else {
        id = await interventionRepository.create(data as any);
      }
      await db.interventions.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await interventionRepository.delete(id);
      await db.interventions.delete(id);
    }
  },
  projects: {
    async save(project: Partial<ConstructionProject>) {
      const user = auth.currentUser;
      const data = {
        ...project,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = project.id;
      if (project.id) {
        await projectRepository.update(project.id, data);
      } else {
        id = await projectRepository.create(data as any);
      }
      await db.projects.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await projectRepository.delete(id);
      await db.projects.delete(id);
    }
  },
  vehicles: {
    async save(vehicle: Partial<TransportVehicle>) {
      const user = auth.currentUser;
      const data = {
        ...vehicle,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = vehicle.id;
      if (vehicle.id) {
        await vehicleRepository.update(vehicle.id, data);
      } else {
        id = await vehicleRepository.create(data as any);
      }
      await db.vehicles.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await vehicleRepository.delete(id);
      await db.vehicles.delete(id);
    }
  },
  employees: {
    async save(employee: Partial<HREmployee>) {
      const user = auth.currentUser;
      const data = {
        ...employee,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = employee.id;
      if (employee.id) {
        await employeeRepository.update(employee.id, data);
      } else {
        id = await employeeRepository.create(data as any);
      }
      await db.employees.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await employeeRepository.delete(id);
      await db.employees.delete(id);
    }
  },
  students: {
    async save(student: Partial<SchoolStudent>) {
      const user = auth.currentUser;
      const data = {
        ...student,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = student.id;
      if (student.id) {
        await studentRepository.update(student.id, data);
      } else {
        id = await studentRepository.create(data as any);
      }
      await db.students.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await studentRepository.delete(id);
      await db.students.delete(id);
    }
  },
  patients: {
    async save(patient: Partial<MedicalPatient>) {
      const user = auth.currentUser;
      const data = {
        ...patient,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = patient.id;
      if (patient.id) {
        await patientRepository.update(patient.id, data);
      } else {
        id = await patientRepository.create(data as any);
      }
      await db.patients.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await patientRepository.delete(id);
      await db.patients.delete(id);
    }
  },
  appointments: {
    async save(appointment: Partial<MedicalAppointment>) {
      const user = auth.currentUser;
      const data = {
        ...appointment,
        owner_id: user?.uid,
        ownerId: user?.uid
      };
      let id = appointment.id;
      if (appointment.id) {
        await appointmentRepository.update(appointment.id, data);
      } else {
        id = await appointmentRepository.create(data as any);
      }
      await db.appointments.put({ ...data, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await appointmentRepository.delete(id);
      await db.appointments.delete(id);
    }
  },
  designBlocks: {
    async getAll(designId: string) {
      // Prefer Dexie if available, but for blocks we often want fresh data or synced data
      const localBlocks = await db.design_blocks.where('designId').equals(designId).toArray();
      if (localBlocks.length > 0) return localBlocks;
      
      const remoteBlocks = await designBlockRepository.getAll(designId);
      if (remoteBlocks.length > 0) {
        await db.design_blocks.bulkPut(remoteBlocks.map(b => ({ ...b, designId })));
      }
      return remoteBlocks;
    },
    async saveLocal(designId: string, block: any) {
      const id = block.id; // generate later if none? Well card layers usually have ids
      await db.design_blocks.put({ ...block, id, designId, updatedAt: new Date() });
      return id;
    },
    async save(designId: string, block: any) {
      let id = block.id;
      if (block.id) {
        await designBlockRepository.update(designId, block.id, block);
      } else {
        id = await designBlockRepository.create(designId, block);
      }
      await db.design_blocks.put({ ...block, id, designId, updatedAt: new Date() });
      return id;
    },
    async delete(designId: string, blockId: string) {
      await designBlockRepository.delete(designId, blockId);
      await db.design_blocks.delete(blockId);
    }
  },
  designs: {
    async saveLocal(design: Partial<Design>) {
      let id = design.id;
      if (!id) id = uuidv4();
      await db.designs.put({ ...design, id, updatedAt: new Date() });
      return id;
    },
    async save(design: Partial<Design>) {
      let id = design.id;
      if (design.id) {
        await designRepository.update(design.id, design);
      } else {
        id = await designRepository.create(design as any);
      }
      await db.designs.put({ ...design, id, updatedAt: new Date() });
      return id;
    },
    async getById(id: string) {
      const local = await db.designs.get(id);
      if (local) return local;
      return designRepository.getById(id);
    },
    async delete(id: string) {
      await designRepository.delete(id);
      await db.designs.delete(id);
    }
  },
  templates: {
    async save(template: any) {
      let id = template.id;
      if (template.id) {
        await templateRepository.update(template.id, template);
      } else {
        id = await templateRepository.create(template);
      }
      await db.templates.put({ ...template, id, updatedAt: new Date() });
      return id;
    },
    async delete(id: string) {
      await templateRepository.delete(id);
      await db.templates.delete(id);
    }
  },
  partnerRatings: {
    async save(rating: Partial<PartnerRating>) {
      if (rating.id) {
        return partnerRatingRepository.update(rating.id, rating);
      }
      return partnerRatingRepository.create(rating as any);
    },
    async getByOrder(orderId: string) {
      const { where } = await import('firebase/firestore');
      return partnerRatingRepository.getAll([where('orderId', '==', orderId)]);
    }
  },
  assets: {
    async save(asset: any) {
      let id = asset.id;
      if (asset.id) {
        await assetRepository.update(asset.id, asset);
      } else {
        id = await assetRepository.create(asset);
      }
      await db.assets.put({ ...asset, id, updatedAt: new Date() });
      return id;
    },
    async delete(id: string) {
      await assetRepository.delete(id);
      await db.assets.delete(id);
    }
  },
  designRequests: {
    async save(request: any) {
      const id = await designRequestRepository.create(request);
      await db.design_requests.put({ ...request, id, updatedAt: new Date() });
      return id;
    }
  }
};
