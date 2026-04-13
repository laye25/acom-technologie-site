import { where, orderBy, limit } from 'firebase/firestore';
import { Service, PortfolioItem, BlogPost, UserProfile, Order, Design, Expense, Merchant, MerchantProduct, MerchantSale, MerchantExpense, MerchantSupplier, StockMovement, ServiceIntervention, ConstructionProject, TransportVehicle, HREmployee, SchoolStudent, MedicalPatient, MedicalAppointment } from '../types';
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
import { activityService } from './activityService';

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
      return messageRepository.create(message);
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
          icon: category.icon || 'LayoutGrid',
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
    async save(user: Partial<UserProfile>) {
      if (user.uid) {
        // For users, we use uid as doc id
        const repo = userRepository;
        const exists = await repo.getById(user.uid);
        if (exists) {
          return repo.update(user.uid, user);
        } else {
          // Use setDoc logic via repository if possible, or direct for now
          // BaseRepository uses addDoc for create, which generates random ID.
          // We need a way to set ID.
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
    async delete(id: string) {
      return userRepository.delete(id);
    }
  },
  merchants: {
    async getByOwner(ownerId: string) {
      const merchants = await merchantRepository.getAll([
        where('owner_id', '==', ownerId),
        orderBy('created_at', 'desc'),
        limit(1)
      ]);
      return merchants.length > 0 ? merchants[0] : null;
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
      if (product.id) {
        return merchantProductRepository.update(product.id, product);
      }
      return merchantProductRepository.create(product as any);
    },
    async delete(id: string) {
      return merchantProductRepository.delete(id);
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

      return id;
    }
  },
  merchantExpenses: {
    async save(expense: Partial<MerchantExpense>) {
      if (expense.id) {
        return merchantExpenseRepository.update(expense.id, expense);
      }
      return merchantExpenseRepository.create(expense as any);
    },
    async delete(id: string) {
      return merchantExpenseRepository.delete(id);
    }
  },
  merchantSuppliers: {
    async save(supplier: Partial<MerchantSupplier>) {
      if (supplier.id) {
        return merchantSupplierRepository.update(supplier.id, supplier);
      }
      return merchantSupplierRepository.create(supplier as any);
    },
    async delete(id: string) {
      return merchantSupplierRepository.delete(id);
    }
  },
  stockMovements: {
    async addStock(merchantId: string, productId: string, quantity: number, reason: string, performedBy: string, cost?: number) {
      const product = await merchantProductRepository.getById(productId);
      if (!product) throw new Error('Produit non trouvé');

      const currentStock = product.stockQuantity || (product as any).stock_quantity || 0;
      const newStock = currentStock + quantity;

      await merchantProductRepository.update(productId, { stockQuantity: newStock } as any);

      await stockMovementRepository.create({
        merchantId,
        productId,
        type: 'in',
        quantity,
        previousQuantity: currentStock,
        newQuantity: newStock,
        reason,
        performedBy
      } as any);

      if (cost && cost > 0) {
        await merchantExpenseRepository.create({
          merchantId,
          title: `Approvisionnement: ${product.name}`,
          amount: cost,
          category: 'Stock',
          date: new Date().toISOString().split('T')[0]
        } as any);
      }
    }
  },
  interventions: {
    async save(intervention: Partial<ServiceIntervention>) {
      if (intervention.id) {
        return interventionRepository.update(intervention.id, intervention);
      }
      return interventionRepository.create(intervention as any);
    },
    async delete(id: string) {
      return interventionRepository.delete(id);
    }
  },
  projects: {
    async save(project: Partial<ConstructionProject>) {
      if (project.id) {
        return projectRepository.update(project.id, project);
      }
      return projectRepository.create(project as any);
    },
    async delete(id: string) {
      return projectRepository.delete(id);
    }
  },
  vehicles: {
    async save(vehicle: Partial<TransportVehicle>) {
      if (vehicle.id) {
        return vehicleRepository.update(vehicle.id, vehicle);
      }
      return vehicleRepository.create(vehicle as any);
    },
    async delete(id: string) {
      return vehicleRepository.delete(id);
    }
  },
  employees: {
    async save(employee: Partial<HREmployee>) {
      if (employee.id) {
        return employeeRepository.update(employee.id, employee);
      }
      return employeeRepository.create(employee as any);
    },
    async delete(id: string) {
      return employeeRepository.delete(id);
    }
  },
  students: {
    async save(student: Partial<SchoolStudent>) {
      if (student.id) {
        return studentRepository.update(student.id, student);
      }
      return studentRepository.create(student as any);
    },
    async delete(id: string) {
      return studentRepository.delete(id);
    }
  },
  patients: {
    async save(patient: Partial<MedicalPatient>) {
      if (patient.id) {
        return patientRepository.update(patient.id, patient);
      }
      return patientRepository.create(patient as any);
    },
    async delete(id: string) {
      return patientRepository.delete(id);
    }
  },
  appointments: {
    async save(appointment: Partial<MedicalAppointment>) {
      if (appointment.id) {
        return appointmentRepository.update(appointment.id, appointment);
      }
      return appointmentRepository.create(appointment as any);
    },
    async delete(id: string) {
      return appointmentRepository.delete(id);
    }
  },
  designBlocks: {
    async getAll(designId: string) {
      return designBlockRepository.getAll(designId);
    },
    async save(designId: string, block: any) {
      if (block.id) {
        return designBlockRepository.update(designId, block.id, block);
      }
      return designBlockRepository.create(designId, block);
    },
    async delete(designId: string, blockId: string) {
      return designBlockRepository.delete(designId, blockId);
    }
  },
  designs: {
    async save(design: Partial<Design>) {
      if (design.id) {
        return designRepository.update(design.id, design);
      }
      return designRepository.create(design as any);
    },
    async getById(id: string) {
      return designRepository.getById(id);
    },
    async delete(id: string) {
      return designRepository.delete(id);
    }
  }
};
