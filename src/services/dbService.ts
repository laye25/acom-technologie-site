import { supabase } from '../lib/supabase';
import { Service, PortfolioItem, BlogPost, UserProfile } from '../types';

export const dbService = {
  services: {
    async getById(id: string) {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (error) return null;
      return data as Service;
    },
    async save(service: Partial<Service>) {
      const id = service.id || crypto.randomUUID();
      const data = { ...service, id, updated_at: new Date() };
      const { error } = await supabase.from('services').upsert(data);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    }
  },
  orders: {
    async getById(id: string) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    async save(order: any) {
      const id = order.id || crypto.randomUUID();
      const data = { ...order, id, updated_at: new Date() };
      const { error } = await supabase.from('orders').upsert(data);
      if (error) throw error;
      return id;
    }
  },
  portfolio: {
    async save(item: Partial<PortfolioItem>) {
      const id = item.id || crypto.randomUUID();
      const data = { ...item, id, updated_at: new Date() };
      const { error } = await supabase.from('portfolio').upsert(data);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (error) throw error;
    }
  },
  blog: {
    async getById(id: string) {
      const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();
      if (error) return null;
      return data as BlogPost;
    },
    async getRelated(category: string, excludeId: string, limitCount: number = 2) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category', category)
        .neq('id', excludeId)
        .limit(limitCount);
      if (error) throw error;
      return data as BlogPost[];
    },
    async save(post: Partial<BlogPost>) {
      const id = post.id || crypto.randomUUID();
      const data = { ...post, id, updated_at: new Date() };
      const { error } = await supabase.from('blog_posts').upsert(data);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    }
  },
  settings: {
    async save(id: string, data: any) {
      const { error } = await supabase.from('settings').upsert({ id, data, updated_at: new Date() });
      if (error) throw error;
    },
    async get(id: string) {
      const { data, error } = await supabase.from('settings').select('data').eq('id', id).single();
      if (error) return null;
      return data.data;
    },
    onSnapshot(id: string, callback: (data: any) => void) {
      const channel = supabase
        .channel(`public:settings:id=eq.${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${id}` }, (payload: any) => {
          callback(payload.new?.data);
        })
        .subscribe();
      
      // Initial fetch
      this.get(id).then(data => data && callback(data));

      return () => {
        supabase.removeChannel(channel);
      };
    }
  },
  messages: {
    async save(message: any) {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('messages').insert({ ...message, id, created_at: new Date() });
      if (error) throw error;
      return id;
    }
  },
  contactMessages: {
    async save(message: any) {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('messages').insert({ ...message, id, created_at: new Date() });
      if (error) throw error;
      return id;
    }
  },
  expenses: {
    async save(expense: any) {
      const id = expense.id || crypto.randomUUID();
      const { error } = await supabase.from('expenses').upsert({ ...expense, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    async getAll(limitCount: number = 100) {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(limitCount);
      if (error) throw error;
      return data;
    }
  },
  notifications: {
    async save(notification: any) {
      const id = notification.id || crypto.randomUUID();
      const { error } = await supabase.from('notifications').upsert({ ...notification, id, created_at: new Date() });
      if (error) throw error;
      return id;
    },
    async markAsRead(id: string) {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    }
  },
  studioAcom: {
    categories: {
      async save(category: any) {
        const id = category.id || crypto.randomUUID();
        const { coverImage, ...rest } = category;
        const dataToSave = {
          ...rest,
          id,
          cover_image: coverImage || category.cover_image,
          updated_at: new Date()
        };
        const { error } = await supabase.from('studio_acom_categories').upsert(dataToSave);
        if (error) throw error;
        return id;
      },
      async delete(id: string) {
        const { error } = await supabase.from('studio_acom_categories').delete().eq('id', id);
        if (error) throw error;
      }
    },
    products: {
      async save(product: any) {
        const id = product.id || crypto.randomUUID();
        const { variants, categoryId, userId, coverImage, ...productData } = product;
        
        // Ensure we use the correct field names for Supabase
        const finalProductData = {
          ...productData,
          id,
          category_id: categoryId || product.category_id,
          user_id: userId || product.user_id,
          cover_image: coverImage || product.cover_image,
          updated_at: new Date()
        };

        const { error: pError } = await supabase.from('studio_acom_products').upsert(finalProductData);
        if (pError) throw pError;

        if (variants && Array.isArray(variants)) {
          // Delete existing variants to ensure sync (handle deletions)
          await supabase.from('variants').delete().eq('product_id', id);

          if (variants.length > 0) {
            const variantsToInsert = variants.map((variant: any) => {
              // Ensure we have a valid UUID for the variant ID
              // If it's a timestamp from the UI, generate a new UUID
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variant.id || '');
              const vId = isUuid ? variant.id : crypto.randomUUID();

              return {
                id: vId,
                product_id: id,
                name: variant.name || '',
                size: variant.size || '',
                color: variant.color || '',
                shape: variant.shape || '',
                format: variant.format || '',
                finish: variant.finish || '',
                template_id: variant.templateId || variant.template_id || '',
                preview_image: variant.previewImage || variant.preview_image || '',
                price: (typeof variant.price === 'number' && !isNaN(variant.price)) ? variant.price : 0,
                min_quantity: (typeof variant.minQuantity === 'number' && !isNaN(variant.minQuantity)) ? variant.minQuantity : (variant.min_quantity || 0),
                max_quantity: (typeof variant.maxQuantity === 'number' && !isNaN(variant.maxQuantity)) ? variant.maxQuantity : (variant.max_quantity || 0),
                template_svg: variant.templateSvg || variant.template_svg || '',
                updated_at: new Date()
              };
            });

            const { error: vError } = await supabase.from('variants').insert(variantsToInsert);
            if (vError) throw vError;
          }
        }
        return id;
      },
      async delete(id: string) {
        // Delete variants first to avoid foreign key constraint issues
        const { error: vError } = await supabase.from('variants').delete().eq('product_id', id);
        if (vError) console.error('Error deleting variants for product:', vError);
        
        const { error } = await supabase.from('studio_acom_products').delete().eq('id', id);
        if (error) throw error;
      },
      async getVariants(productId: string) {
        const { data, error } = await supabase.from('variants').select('*').eq('product_id', productId);
        if (error) throw error;
        return (data || []).map((v: any) => ({
          ...v,
          productId: v.product_id,
          templateId: v.template_id,
          previewImage: v.preview_image,
          minQuantity: v.min_quantity,
          maxQuantity: v.max_quantity,
          templateSvg: v.template_svg
        }));
      }
    }
  },
  users: {
    async save(user: any) {
      const id = user.id || user.uid || crypto.randomUUID();
      const { error } = await supabase.from('users').upsert({ ...user, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }
  },
  merchants: {
    async getByOwner(ownerId: string) {
      const { data, error } = await supabase.from('merchants').select('*').eq('owner_id', ownerId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        ownerId: data.owner_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    },
    async save(merchant: any) {
      const id = merchant.id || crypto.randomUUID();
      const { ownerId, createdAt, updatedAt, ...rest } = merchant;
      const dataToSave = {
        ...rest,
        id,
        owner_id: ownerId || merchant.owner_id,
        created_at: createdAt || merchant.created_at || new Date(),
        updated_at: new Date()
      };
      const { error } = await supabase.from('merchants').upsert(dataToSave);
      if (error) throw error;
      return id;
    }
  },
  merchantProducts: {
    async save(product: any) {
      const id = product.id || crypto.randomUUID();
      const { merchantId, costPrice, stockQuantity, minStockLevel, createdAt, updatedAt, ...rest } = product;
      const dataToSave = {
        ...rest,
        id,
        merchant_id: merchantId || product.merchant_id,
        cost_price: costPrice || product.cost_price,
        stock_quantity: stockQuantity || product.stock_quantity,
        min_stock_level: minStockLevel || product.min_stock_level,
        created_at: createdAt || product.created_at || new Date(),
        updated_at: new Date()
      };
      const { error } = await supabase.from('merchant_products').upsert(dataToSave);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('merchant_products').delete().eq('id', id);
      if (error) throw error;
    }
  },
  merchantSales: {
    async save(sale: any) {
      const id = sale.id || crypto.randomUUID();
      const { merchantId, totalAmount, paymentMethod, customerName, customerPhone, processedBy, createdAt, ...rest } = sale;
      const dataToSave = {
        ...rest,
        id,
        merchant_id: merchantId || sale.merchant_id,
        total_amount: totalAmount || sale.total_amount,
        payment_method: paymentMethod || sale.payment_method,
        customer_name: customerName || sale.customer_name,
        customer_phone: customerPhone || sale.customer_phone,
        processed_by: processedBy || sale.processed_by,
        created_at: createdAt || sale.created_at || new Date()
      };
      const { error } = await supabase.from('merchant_sales').insert(dataToSave);
      if (error) throw error;

      // Update stock levels
      for (const item of sale.items) {
        const { data: product } = await supabase.from('merchant_products').select('stock_quantity').eq('id', item.productId).single();
        if (product) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
          await supabase.from('merchant_products').update({ stock_quantity: newStock }).eq('id', item.productId);
          
          // Record movement
          await supabase.from('stock_movements').insert({
            id: crypto.randomUUID(),
            merchant_id: dataToSave.merchant_id,
            product_id: item.productId,
            type: 'sale',
            quantity: item.quantity,
            previous_quantity: product.stock_quantity,
            new_quantity: newStock,
            reason: `Vente POS #${id.slice(-6)}`,
            reference_id: id,
            performed_by: dataToSave.processed_by,
            created_at: new Date()
          });
        }
      }
      return id;
    }
  },
  merchantExpenses: {
    async save(expense: any) {
      const id = expense.id || crypto.randomUUID();
      const { merchantId, createdAt, ...rest } = expense;
      const dataToSave = {
        ...rest,
        id,
        merchant_id: merchantId || expense.merchant_id,
        created_at: createdAt || expense.created_at || new Date()
      };
      const { error } = await supabase.from('merchant_expenses').upsert(dataToSave);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('merchant_expenses').delete().eq('id', id);
      if (error) throw error;
    }
  },
  merchantSuppliers: {
    async save(supplier: any) {
      const id = supplier.id || crypto.randomUUID();
      const { merchantId, contactName, createdAt, updatedAt, ...rest } = supplier;
      const dataToSave = {
        ...rest,
        id,
        merchant_id: merchantId || supplier.merchant_id,
        contact_name: contactName || supplier.contact_name,
        created_at: createdAt || supplier.created_at || new Date(),
        updated_at: new Date()
      };
      const { error } = await supabase.from('merchant_suppliers').upsert(dataToSave);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('merchant_suppliers').delete().eq('id', id);
      if (error) throw error;
    }
  },
  stockMovements: {
    async addStock(merchantId: string, productId: string, quantity: number, reason: string, performedBy: string, cost?: number) {
      const { data: product } = await supabase.from('merchant_products').select('name, stock_quantity').eq('id', productId).single();
      if (!product) throw new Error('Produit non trouvé');

      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + quantity;

      await supabase.from('merchant_products').update({ stock_quantity: newStock }).eq('id', productId);

      await supabase.from('stock_movements').insert({
        id: crypto.randomUUID(),
        merchant_id: merchantId,
        product_id: productId,
        type: 'in',
        quantity,
        previous_quantity: currentStock,
        new_quantity: newStock,
        reason,
        performed_by: performedBy,
        created_at: new Date()
      });

      if (cost && cost > 0) {
        await supabase.from('merchant_expenses').insert({
          id: crypto.randomUUID(),
          merchant_id: merchantId,
          title: `Approvisionnement: ${product.name}`,
          amount: cost,
          category: 'Stock',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date()
        });
      }
    }
  },
  interventions: {
    async save(intervention: any) {
      const id = intervention.id || crypto.randomUUID();
      const { error } = await supabase.from('interventions').upsert({ ...intervention, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('interventions').delete().eq('id', id);
      if (error) throw error;
    }
  },
  projects: {
    async save(project: any) {
      const id = project.id || crypto.randomUUID();
      const { error } = await supabase.from('projects').upsert({ ...project, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    }
  },
  vehicles: {
    async save(vehicle: any) {
      const id = vehicle.id || crypto.randomUUID();
      const { error } = await supabase.from('vehicles').upsert({ ...vehicle, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    }
  },
  employees: {
    async save(employee: any) {
      const id = employee.id || crypto.randomUUID();
      const { error } = await supabase.from('employees').upsert({ ...employee, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    }
  },
  students: {
    async save(student: any) {
      const id = student.id || crypto.randomUUID();
      const { error } = await supabase.from('students').upsert({ ...student, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    }
  },
  patients: {
    async save(patient: any) {
      const id = patient.id || crypto.randomUUID();
      const { error } = await supabase.from('patients').upsert({ ...patient, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
    }
  },
  appointments: {
    async save(appointment: any) {
      const id = appointment.id || crypto.randomUUID();
      const { error } = await supabase.from('appointments').upsert({ ...appointment, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    }
  },
  designs: {
    async save(design: any) {
      const id = design.id || crypto.randomUUID();
      const { error } = await supabase.from('designs').upsert({ ...design, id, updated_at: new Date() });
      if (error) throw error;
      return id;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('designs').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('designs').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
