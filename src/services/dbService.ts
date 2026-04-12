import { firestoreService } from './firestoreService';
import { where, orderBy, limit } from 'firebase/firestore';
import { Service, PortfolioItem, BlogPost, UserProfile } from '../types';

export const dbService = {
  services: {
    async getById(id: string) {
      return firestoreService.getById<Service>('services', id);
    },
    async save(service: Partial<Service>) {
      return firestoreService.save('services', service);
    },
    async delete(id: string) {
      return firestoreService.delete('services', id);
    }
  },
  orders: {
    async getById(id: string) {
      return firestoreService.getById<any>('orders', id);
    },
    async save(order: any) {
      return firestoreService.save('orders', order);
    }
  },
  portfolio: {
    async save(item: Partial<PortfolioItem>) {
      return firestoreService.save('portfolio', item);
    },
    async delete(id: string) {
      return firestoreService.delete('portfolio', id);
    }
  },
  blog: {
    async getById(id: string) {
      return firestoreService.getById<BlogPost>('blog_posts', id);
    },
    async getRelated(category: string, excludeId: string, limitCount: number = 2) {
      return firestoreService.getAll<BlogPost>('blog_posts', [
        where('category', '==', category),
        where('id', '!=', excludeId),
        limit(limitCount)
      ]);
    },
    async save(post: Partial<BlogPost>) {
      return firestoreService.save('blog_posts', post);
    },
    async delete(id: string) {
      return firestoreService.delete('blog_posts', id);
    }
  },
  settings: {
    async save(id: string, settingsData: any) {
      return firestoreService.save('settings', { id, data: settingsData });
    },
    async get(id: string) {
      const settings = await firestoreService.getById<any>('settings', id);
      return settings?.data || settings;
    },
    onSnapshot(id: string, callback: (data: any) => void) {
      return firestoreService.onDocSnapshot<any>('settings', id, (data) => {
        if (data) {
          callback(data.data || data);
        }
      });
    }
  },
  messages: {
    async save(message: any) {
      return firestoreService.add('messages', message);
    }
  },
  contactMessages: {
    async save(message: any) {
      return firestoreService.add('messages', message);
    }
  },
  expenses: {
    async save(expense: any) {
      return firestoreService.save('expenses', expense);
    },
    async delete(id: string) {
      return firestoreService.delete('expenses', id);
    },
    async getAll(limitCount: number = 100) {
      return firestoreService.getAll<any>('expenses', [
        orderBy('date', 'desc'),
        limit(limitCount)
      ]);
    }
  },
  notifications: {
    async save(notification: any) {
      return firestoreService.save('notifications', notification);
    },
    async markAsRead(id: string) {
      return firestoreService.update('notifications', id, { read: true });
    }
  },
  studioAcom: {
    categories: {
      async getAll() {
        return firestoreService.getAll<any>('studio_acom_categories', [orderBy('name', 'asc')]);
      },
      async save(category: any) {
        const data = {
          name: category.name,
          sub: category.sub || '',
          icon: category.icon || 'LayoutGrid',
          color: category.color || 'text-primary',
          cover_image: category.coverImage || category.cover_image || '',
          updated_at: new Date().toISOString()
        };
        return firestoreService.save('studio_acom_categories', { ...data, id: category.id });
      },
      async delete(id: string) {
        return firestoreService.delete('studio_acom_categories', id);
      }
    },
    products: {
      async getAll() {
        return firestoreService.getAll<any>('studio_acom_products', [orderBy('name', 'asc')]);
      },
      async save(product: any) {
        const { variants, ...productData } = product;
        const data = {
          name: productData.name,
          category_id: productData.categoryId || productData.category_id,
          description: productData.description || '',
          cover_image: productData.coverImage || productData.cover_image || '',
          user_id: productData.userId || '',
          updated_at: new Date().toISOString()
        };
        
        const id = await firestoreService.save('studio_acom_products', { ...data, id: productData.id });

        if (variants && Array.isArray(variants)) {
          // Delete existing variants first to avoid duplicates/orphans if we're updating
          const existingVariants = await firestoreService.getAll<any>('variants', [where('product_id', '==', id)]);
          for (const v of existingVariants) {
            await firestoreService.delete('variants', v.id);
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
              updated_at: new Date().toISOString()
            };
            await firestoreService.save('variants', variantData as any);
          }
        }
        return id;
      },
      async delete(id: string) {
        // Delete variants first
        const variants = await firestoreService.getAll<any>('variants', [where('product_id', '==', id)]);
        for (const v of variants) {
          await firestoreService.delete('variants', v.id);
        }
        return firestoreService.delete('studio_acom_products', id);
      },
      async getVariants(productId: string) {
        return firestoreService.getAll<any>('variants', [
          where('product_id', '==', productId)
        ]);
      }
    }
  },
  users: {
    async save(user: any) {
      return firestoreService.save('users', user);
    },
    async delete(id: string) {
      return firestoreService.delete('users', id);
    }
  },
  merchants: {
    async getByOwner(ownerId: string) {
      const merchants = await firestoreService.getAll<any>('merchants', [
        where('owner_id', '==', ownerId),
        orderBy('created_at', 'desc'),
        limit(1)
      ]);
      return merchants.length > 0 ? merchants[0] : null;
    },
    async save(merchant: any) {
      return firestoreService.save('merchants', merchant);
    }
  },
  merchantProducts: {
    async save(product: any) {
      return firestoreService.save('merchant_products', product);
    },
    async delete(id: string) {
      return firestoreService.delete('merchant_products', id);
    }
  },
  merchantSales: {
    async save(sale: any) {
      const id = await firestoreService.add('merchant_sales', sale);

      // Update stock levels (simplified for Firestore)
      for (const item of sale.items) {
        const product = await firestoreService.getById<any>('merchant_products', item.productId);
        if (product) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
          await firestoreService.update('merchant_products', item.productId, { stock_quantity: newStock });
          
          // Record movement
          await firestoreService.add('stock_movements', {
            merchant_id: sale.merchant_id,
            product_id: item.productId,
            type: 'sale',
            quantity: item.quantity,
            previous_quantity: product.stock_quantity,
            new_quantity: newStock,
            reason: `Vente POS #${id.slice(-6)}`,
            reference_id: id,
            performed_by: sale.processed_by
          });
        }
      }
      return id;
    }
  },
  merchantExpenses: {
    async save(expense: any) {
      return firestoreService.save('merchant_expenses', expense);
    },
    async delete(id: string) {
      return firestoreService.delete('merchant_expenses', id);
    }
  },
  merchantSuppliers: {
    async save(supplier: any) {
      return firestoreService.save('merchant_suppliers', supplier);
    },
    async delete(id: string) {
      return firestoreService.delete('merchant_suppliers', id);
    }
  },
  stockMovements: {
    async addStock(merchantId: string, productId: string, quantity: number, reason: string, performedBy: string, cost?: number) {
      const product = await firestoreService.getById<any>('merchant_products', productId);
      if (!product) throw new Error('Produit non trouvé');

      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + quantity;

      await firestoreService.update('merchant_products', productId, { stock_quantity: newStock });

      await firestoreService.add('stock_movements', {
        merchant_id: merchantId,
        product_id: productId,
        type: 'in',
        quantity,
        previous_quantity: currentStock,
        new_quantity: newStock,
        reason,
        performed_by: performedBy
      });

      if (cost && cost > 0) {
        await firestoreService.add('merchant_expenses', {
          merchant_id: merchantId,
          title: `Approvisionnement: ${product.name}`,
          amount: cost,
          category: 'Stock',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  },
  interventions: {
    async save(intervention: any) {
      return firestoreService.save('interventions', intervention);
    },
    async delete(id: string) {
      return firestoreService.delete('interventions', id);
    }
  },
  projects: {
    async save(project: any) {
      return firestoreService.save('projects', project);
    },
    async delete(id: string) {
      return firestoreService.delete('projects', id);
    }
  },
  vehicles: {
    async save(vehicle: any) {
      return firestoreService.save('vehicles', vehicle);
    },
    async delete(id: string) {
      return firestoreService.delete('vehicles', id);
    }
  },
  employees: {
    async save(employee: any) {
      return firestoreService.save('employees', employee);
    },
    async delete(id: string) {
      return firestoreService.delete('employees', id);
    }
  },
  students: {
    async save(student: any) {
      return firestoreService.save('students', student);
    },
    async delete(id: string) {
      return firestoreService.delete('students', id);
    }
  },
  patients: {
    async save(patient: any) {
      return firestoreService.save('patients', patient);
    },
    async delete(id: string) {
      return firestoreService.delete('patients', id);
    }
  },
  appointments: {
    async save(appointment: any) {
      return firestoreService.save('appointments', appointment);
    },
    async delete(id: string) {
      return firestoreService.delete('appointments', id);
    }
  },
  designs: {
    async save(design: any) {
      return firestoreService.save('designs', design);
    },
    async getById(id: string) {
      return firestoreService.getById<any>('designs', id);
    },
    async delete(id: string) {
      return firestoreService.delete('designs', id);
    }
  }
};
