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
import { db } from '../db/db';

export const dbService = {
  services: {
    async getById(id: string) {
      return serviceRepository.getById(id);
    },
    async save(service: Partial<Service>) {
      if (service.id) {
        return serviceRepository.update(service.id, service);
      }
      return serviceRepository.create(service as any);
    },
    async delete(id: string) {
      return serviceRepository.delete(id);
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
        return portfolioRepository.update(item.id, item);
      }
      return portfolioRepository.create(item as any);
    },
    async delete(id: string) {
      return portfolioRepository.delete(id);
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
        return blogRepository.update(post.id, post);
      }
      return blogRepository.create(post as any);
    },
    async delete(id: string) {
      return blogRepository.delete(id);
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
        if (category.id) {
          return categoryRepository.update(category.id, data);
        }
        return categoryRepository.create(data as any);
      },
      async delete(id: string) {
        return categoryRepository.delete(id);
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

        if (variants && Array.isArray(variants)) {
          // Delete existing variants first
          const existingVariants = await variantRepository.getAll([where('product_id', '==', id)]);
          for (const v of existingVariants) {
            await variantRepository.delete(v.id);
          }

          // Save new variants
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
            await variantRepository.create(variantData as any);
          }
        }
        return id;
      },
      async delete(id: string) {
        // Delete variants first
        const variants = await variantRepository.getAll([where('product_id', '==', id)]);
        for (const v of variants) {
          await variantRepository.delete(v.id);
        }
        return studioAcomProductRepository.delete(id);
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
      if (merchant.id) {
        return merchantRepository.update(merchant.id, merchant);
      }
      const id = await merchantRepository.create(merchant as any);
      await activityService.log({
        type: 'merchant_created',
        entityId: id,
        entityType: 'merchant',
        merchantId: id,
        message: `Nouveau marchand créé: ${merchant.name}`
      });
      return id;
    }
  },
  merchantProducts: {
    async save(product: Partial<MerchantProduct>) {
      let id = product.id;
      if (product.id) {
        await merchantProductRepository.update(product.id, product);
      } else {
        id = await merchantProductRepository.create(product as any);
      }
      // Update local Dexie for immediate feedback
      await db.products.put({ ...product, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await merchantProductRepository.delete(id);
      await db.products.delete(id);
    }
  },
  merchantSales: {
    async save(sale: any) {
      const id = await merchantSaleRepository.create(sale);

      // Update stock levels
      for (const item of sale.items) {
        const product = await merchantProductRepository.getById(item.productId);
        if (product) {
          const newStock = Math.max(0, (product.stockQuantity || (product as any).stock_quantity || 0) - item.quantity);
          await merchantProductRepository.update(item.productId, { stockQuantity: newStock } as any);
          
          // Record movement
          await stockMovementRepository.create({
            merchantId: sale.merchantId || sale.merchant_id,
            productId: item.productId,
            type: 'sale',
            quantity: item.quantity,
            previousQuantity: product.stockQuantity || (product as any).stock_quantity,
            newQuantity: newStock,
            reason: `Vente POS #${id.slice(-6)}`,
            referenceId: id,
            performedBy: sale.processedBy || sale.processed_by
          } as any);

          // Check for low stock alert
          const minLevel = product.minStockLevel || (product as any).min_stock_level || 5;
          if (newStock <= minLevel) {
            await activityService.log({
              type: 'stock_alert',
              entityId: item.productId,
              entityType: 'product',
              merchantId: sale.merchantId || sale.merchant_id,
              message: `Alerte Stock: Le produit "${product.name}" est en dessous du seuil critique (${newStock} restants).`,
              metadata: { currentStock: newStock, minLevel }
            });
          }
        }
      }

      await activityService.log({
        type: 'payment_received',
        entityId: id,
        entityType: 'sale',
        merchantId: sale.merchantId || sale.merchant_id,
        message: `Nouvelle vente enregistrée: ${(sale.totalAmount || sale.total_amount).toLocaleString()} FCFA`,
        metadata: { amount: sale.totalAmount || sale.total_amount }
      });

      // Update local Dexie
      await db.sales.put({ ...sale, id, createdAt: sale.createdAt || new Date() } as any);

      return id;
    }
  },
  merchantExpenses: {
    async save(expense: Partial<MerchantExpense>) {
      let id = expense.id;
      if (expense.id) {
        await merchantExpenseRepository.update(expense.id, expense);
      } else {
        id = await merchantExpenseRepository.create(expense as any);
      }
      await db.expenses.put({ ...expense, id, createdAt: expense.createdAt || new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await merchantExpenseRepository.delete(id);
      await db.expenses.delete(id);
    }
  },
  merchantSuppliers: {
    async save(supplier: Partial<MerchantSupplier>) {
      let id = supplier.id;
      if (supplier.id) {
        await merchantSupplierRepository.update(supplier.id, supplier);
      } else {
        id = await merchantSupplierRepository.create(supplier as any);
      }
      await db.suppliers.put({ ...supplier, id, updatedAt: new Date() } as any);
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

      const movementId = await stockMovementRepository.create({
        merchantId,
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
      let id = intervention.id;
      if (intervention.id) {
        await interventionRepository.update(intervention.id, intervention);
      } else {
        id = await interventionRepository.create(intervention as any);
      }
      await db.interventions.put({ ...intervention, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await interventionRepository.delete(id);
      await db.interventions.delete(id);
    }
  },
  projects: {
    async save(project: Partial<ConstructionProject>) {
      let id = project.id;
      if (project.id) {
        await projectRepository.update(project.id, project);
      } else {
        id = await projectRepository.create(project as any);
      }
      await db.projects.put({ ...project, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await projectRepository.delete(id);
      await db.projects.delete(id);
    }
  },
  vehicles: {
    async save(vehicle: Partial<TransportVehicle>) {
      let id = vehicle.id;
      if (vehicle.id) {
        await vehicleRepository.update(vehicle.id, vehicle);
      } else {
        id = await vehicleRepository.create(vehicle as any);
      }
      await db.vehicles.put({ ...vehicle, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await vehicleRepository.delete(id);
      await db.vehicles.delete(id);
    }
  },
  employees: {
    async save(employee: Partial<HREmployee>) {
      let id = employee.id;
      if (employee.id) {
        await employeeRepository.update(employee.id, employee);
      } else {
        id = await employeeRepository.create(employee as any);
      }
      await db.employees.put({ ...employee, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await employeeRepository.delete(id);
      await db.employees.delete(id);
    }
  },
  students: {
    async save(student: Partial<SchoolStudent>) {
      let id = student.id;
      if (student.id) {
        await studentRepository.update(student.id, student);
      } else {
        id = await studentRepository.create(student as any);
      }
      await db.students.put({ ...student, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await studentRepository.delete(id);
      await db.students.delete(id);
    }
  },
  patients: {
    async save(patient: Partial<MedicalPatient>) {
      let id = patient.id;
      if (patient.id) {
        await patientRepository.update(patient.id, patient);
      } else {
        id = await patientRepository.create(patient as any);
      }
      await db.patients.put({ ...patient, id, updatedAt: new Date() } as any);
      return id;
    },
    async delete(id: string) {
      await patientRepository.delete(id);
      await db.patients.delete(id);
    }
  },
  appointments: {
    async save(appointment: Partial<MedicalAppointment>) {
      let id = appointment.id;
      if (appointment.id) {
        await appointmentRepository.update(appointment.id, appointment);
      } else {
        id = await appointmentRepository.create(appointment as any);
      }
      await db.appointments.put({ ...appointment, id, updatedAt: new Date() } as any);
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
