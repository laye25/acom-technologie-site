import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  writeBatch,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Service, PortfolioItem, BlogPost } from '../types';

import { 
  SERVICES, BLOG_POSTS, PORTFOLIO_ITEMS, DEFAULT_SETTINGS 
} from '../constants';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../constants/studioAcom';

export const dbService = {
  services: {
    async getById(id: string) {
      try {
        const docSnap = await getDoc(doc(db, 'services', id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Service : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `services/${id}`);
      }
    },
    async save(service: Partial<Service>) {
      try {
        const id = service.id || doc(collection(db, 'services')).id;
        const docRef = doc(db, 'services', id);
        const data = {
          ...service,
          id,
          updatedAt: new Date()
        };
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'services');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'services');
      }
    }
  },
  orders: {
    async getById(id: string) {
      try {
        const docSnap = await getDoc(doc(db, 'orders', id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as any : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `orders/${id}`);
      }
    },
    async save(order: any) {
      try {
        const id = order.id || doc(collection(db, 'orders')).id;
        const docRef = doc(db, 'orders', id);
        
        const data = {
          ...order,
          id,
          updatedAt: new Date(),
          createdAt: order.id ? undefined : new Date()
        };

        // Remove any undefined values (Firestore doesn't accept undefined)
        Object.keys(data).forEach(key => {
          if (data[key] === undefined) {
            delete data[key];
          }
        });

        if (order.id) {
          // Update existing order
          const { id: _, createdAt: __, ...updateData } = data;
          await updateDoc(docRef, updateData);
        } else {
          // Create new order
          await setDoc(docRef, data);

          // Point 6: Aggregation - Update global stats (simplified client-side version)
          try {
            const statsRef = doc(db, 'settings', 'stats');
            const statsSnap = await getDoc(statsRef);
            const currentStats = statsSnap.exists() ? statsSnap.data() : { totalOrders: 0, totalRevenue: 0 };
            
            await setDoc(statsRef, {
              totalOrders: (currentStats.totalOrders || 0) + 1,
              totalRevenue: (currentStats.totalRevenue || 0) + (order.totalPrice || 0),
              lastOrderAt: new Date(),
              updatedAt: new Date()
            }, { merge: true });
          } catch (statsErr) {
            console.warn('Failed to update global stats:', statsErr);
            // Non-blocking error
          }
        }
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      }
    }
  },
  portfolio: {
    async save(item: Partial<PortfolioItem>) {
      try {
        const id = item.id || doc(collection(db, 'portfolio')).id;
        const docRef = doc(db, 'portfolio', id);
        const data = {
          ...item,
          id,
          updatedAt: new Date()
        };
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'portfolio');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'portfolio', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'portfolio');
      }
    }
  },
  blog: {
    async getById(id: string) {
      try {
        const docSnap = await getDoc(doc(db, 'blog_posts', id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as BlogPost : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `blog_posts/${id}`);
      }
    },
    async getRelated(category: string, excludeId: string, limitCount: number = 2) {
      try {
        const q = query(
          collection(db, 'blog_posts'),
          where('category', '==', category),
          limit(limitCount + 1)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
          .filter(post => post.id !== excludeId)
          .slice(0, limitCount);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'blog_posts');
      }
    },
    async save(post: Partial<BlogPost>) {
      try {
        const id = post.id || doc(collection(db, 'blog_posts')).id;
        const docRef = doc(db, 'blog_posts', id);
        const data = {
          ...post,
          id,
          updatedAt: new Date(),
          created_at: post.id ? undefined : new Date()
        };
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'blog_posts');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'blog_posts', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'blog_posts');
      }
    }
  },
  settings: {
    async save(id: string, data: any) {
      try {
        await setDoc(doc(db, 'settings', id), data, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/${id}`);
      }
    },
    async get(id: string) {
      try {
        const docSnap = await getDoc(doc(db, 'settings', id));
        return docSnap.exists() ? docSnap.data() : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `settings/${id}`);
      }
    },
    onSnapshot(id: string, callback: (data: any) => void) {
      return onSnapshot(doc(db, 'settings', id), (doc) => {
        if (doc.exists()) {
          callback(doc.data());
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `settings/${id}`);
      });
    }
  },
  messages: {
    async save(message: any) {
      try {
        const id = doc(collection(db, 'messages')).id;
        const docRef = doc(db, 'messages', id);
        const data = {
          ...message,
          id,
          createdAt: new Date()
        };
        await setDoc(docRef, data);
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'messages');
      }
    }
  },
  contactMessages: {
    async save(message: any) {
      try {
        const id = doc(collection(db, 'contact_messages')).id;
        const docRef = doc(db, 'contact_messages', id);
        const data = {
          ...message,
          id,
          createdAt: new Date()
        };
        await setDoc(docRef, data);
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'contact_messages');
      }
    }
  },
  expenses: {
    async save(expense: any) {
      try {
        const id = expense.id || doc(collection(db, 'expenses')).id;
        const docRef = doc(db, 'expenses', id);
        const data = {
          ...expense,
          id,
          updatedAt: new Date(),
          createdAt: expense.id ? undefined : new Date()
        };
        // Remove undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'expenses');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'expenses');
      }
    },
    async getAll(limitCount: number = 100) {
      try {
        const q = query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    }
  },
  notifications: {
    async save(notification: any) {
      try {
        const id = notification.id || doc(collection(db, 'notifications')).id;
        const docRef = doc(db, 'notifications', id);
        const data = {
          ...notification,
          id,
          read: notification.read || false,
          createdAt: new Date()
        };
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'notifications');
      }
    },
    async markAsRead(id: string) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `notifications/${id}`);
      }
    }
  },
  studioAcom: {
    categories: {
      async save(category: any) {
        try {
          const id = category.id || doc(collection(db, 'studio_acom_categories')).id;
          const docRef = doc(db, 'studio_acom_categories', id);
          const data = { ...category, id, updatedAt: new Date() };
          // Remove undefined values
          Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
          await setDoc(docRef, data, { merge: true });
          return id;
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'studio_acom_categories');
        }
      },
      async delete(id: string) {
        try {
          await deleteDoc(doc(db, 'studio_acom_categories', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'studio_acom_categories');
        }
      }
    },
    products: {
      async save(product: any) {
        try {
          const id = product.id || doc(collection(db, 'studio_acom_products')).id;
          const docRef = doc(db, 'studio_acom_products', id);
          const data = { ...product, id, updatedAt: new Date() };
          // Remove undefined values
          Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
          await setDoc(docRef, data, { merge: true });
          return id;
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'studio_acom_products');
        }
      },
      async delete(id: string) {
        try {
          await deleteDoc(doc(db, 'studio_acom_products', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'studio_acom_products');
        }
      }
    }
  },
  users: {
    async save(user: any) {
      try {
        const id = user.id || user.uid || doc(collection(db, 'users')).id;
        const docRef = doc(db, 'users', id);
        const data = {
          ...user,
          id,
          updatedAt: new Date(),
          createdAt: user.id || user.uid ? undefined : new Date()
        };
        // Remove undefined
        Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'users');
      }
    }
  },
  merchants: {
    async getByOwner(ownerId: string) {
      try {
        const q = query(collection(db, 'merchants'), where('ownerId', '==', ownerId), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as any;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'merchants');
      }
    },
    async save(merchant: any) {
      try {
        const id = merchant.id || doc(collection(db, 'merchants')).id;
        const docRef = doc(db, 'merchants', id);
        const data = { ...merchant, id, updatedAt: new Date(), createdAt: merchant.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'merchants');
      }
    }
  },
  merchantProducts: {
    async save(product: any) {
      try {
        const id = product.id || doc(collection(db, 'merchant_products')).id;
        const docRef = doc(db, 'merchant_products', id);
        const data = { ...product, id, updatedAt: new Date(), createdAt: product.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'merchant_products');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'merchant_products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'merchant_products');
      }
    }
  },
  merchantSales: {
    async save(sale: any) {
      try {
        const batch = writeBatch(db);
        const id = sale.id || doc(collection(db, 'merchant_sales')).id;
        const docRef = doc(db, 'merchant_sales', id);
        const data = { ...sale, id, createdAt: new Date() };
        
        batch.set(docRef, data);

        // Update stock levels and record movements
        for (const item of sale.items) {
          const productRef = doc(db, 'merchant_products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stockQuantity || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            
            batch.update(productRef, { 
              stockQuantity: newStock,
              updatedAt: new Date()
            });

            // Record movement
            const movementRef = doc(collection(db, 'stock_movements'));
            batch.set(movementRef, {
              id: movementRef.id,
              merchantId: sale.merchantId,
              productId: item.productId,
              type: 'sale',
              quantity: item.quantity,
              previousQuantity: currentStock,
              newQuantity: newStock,
              reason: `Vente POS #${id.slice(-6)}`,
              referenceId: id,
              performedBy: sale.processedBy,
              createdAt: new Date()
            });
          }
        }

        await batch.commit();

        // Point 6: Aggregation - Update merchant stats
        try {
          const statsRef = doc(db, 'merchant_stats', sale.merchantId);
          const statsSnap = await getDoc(statsRef);
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const thisMonth = now.toISOString().slice(0, 7);
          const thisYear = now.getFullYear().toString();
          
          const currentStats = statsSnap.exists() ? statsSnap.data() : { 
            revenue: { today: 0, month: 0, year: 0, total: 0 },
            lastUpdate: today,
            lastMonth: thisMonth,
            lastYear: thisYear
          };

          const newStats = { ...currentStats };
          if (!newStats.revenue) newStats.revenue = { today: 0, month: 0, year: 0, total: 0 };
          
          // Reset if date changed
          if (newStats.lastUpdate !== today) newStats.revenue.today = 0;
          if (newStats.lastMonth !== thisMonth) newStats.revenue.month = 0;
          if (newStats.lastYear !== thisYear) newStats.revenue.year = 0;

          newStats.revenue.today += sale.totalAmount;
          newStats.revenue.month += sale.totalAmount;
          newStats.revenue.year += sale.totalAmount;
          newStats.revenue.total += sale.totalAmount;
          newStats.lastUpdate = today;
          newStats.lastMonth = thisMonth;
          newStats.lastYear = thisYear;
          newStats.updatedAt = new Date();

          await setDoc(statsRef, newStats, { merge: true });
        } catch (statsErr) {
          console.warn('Failed to update merchant stats:', statsErr);
        }

        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'merchant_sales');
      }
    }
  },
  merchantExpenses: {
    async save(expense: any) {
      try {
        const id = expense.id || doc(collection(db, 'merchant_expenses')).id;
        const docRef = doc(db, 'merchant_expenses', id);
        const data = { ...expense, id, createdAt: new Date() };
        await setDoc(docRef, data, { merge: true });

        // Point 6: Aggregation - Update merchant stats (expenses)
        try {
          const statsRef = doc(db, 'merchant_stats', expense.merchantId);
          const statsSnap = await getDoc(statsRef);
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const thisMonth = now.toISOString().slice(0, 7);
          const thisYear = now.getFullYear().toString();
          
          const currentStats = statsSnap.exists() ? statsSnap.data() : { 
            expenses: { today: 0, month: 0, year: 0, total: 0 },
            lastUpdate: today,
            lastMonth: thisMonth,
            lastYear: thisYear
          };

          const newStats = { ...currentStats };
          if (!newStats.expenses) newStats.expenses = { today: 0, month: 0, year: 0, total: 0 };
          
          // Reset if date changed
          if (newStats.lastUpdate !== today) newStats.expenses.today = 0;
          if (newStats.lastMonth !== thisMonth) newStats.expenses.month = 0;
          if (newStats.lastYear !== thisYear) newStats.expenses.year = 0;

          newStats.expenses.today += expense.amount;
          newStats.expenses.month += expense.amount;
          newStats.expenses.year += expense.amount;
          newStats.expenses.total += expense.amount;
          newStats.lastUpdate = today;
          newStats.lastMonth = thisMonth;
          newStats.lastYear = thisYear;
          newStats.updatedAt = new Date();

          await setDoc(statsRef, newStats, { merge: true });
        } catch (statsErr) {
          console.warn('Failed to update merchant stats (expenses):', statsErr);
        }

        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'merchant_expenses');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'merchant_expenses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'merchant_expenses');
      }
    }
  },
  merchantSuppliers: {
    async save(supplier: any) {
      try {
        const id = supplier.id || doc(collection(db, 'merchant_suppliers')).id;
        const docRef = doc(db, 'merchant_suppliers', id);
        const data = { ...supplier, id, updatedAt: new Date(), createdAt: supplier.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'merchant_suppliers');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'merchant_suppliers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'merchant_suppliers');
      }
    }
  },
  stockMovements: {
    async save(movement: any) {
      try {
        const id = doc(collection(db, 'stock_movements')).id;
        const docRef = doc(db, 'stock_movements', id);
        const data = { ...movement, id, createdAt: new Date() };
        await setDoc(docRef, data);
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'stock_movements');
      }
    },
    async addStock(merchantId: string, productId: string, quantity: number, reason: string, performedBy: string, cost?: number) {
      try {
        const batch = writeBatch(db);
        const productRef = doc(db, 'merchant_products', productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) throw new Error('Produit non trouvé');
        
        const currentStock = productSnap.data().stockQuantity || 0;
        const newStock = currentStock + quantity;
        
        // Update product stock
        batch.update(productRef, { 
          stockQuantity: newStock,
          updatedAt: new Date()
        });
        
        // Record movement
        const movementRef = doc(collection(db, 'stock_movements'));
        batch.set(movementRef, {
          id: movementRef.id,
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
        
        // Optionally record expense
        if (cost && cost > 0) {
          const expenseRef = doc(collection(db, 'merchant_expenses'));
          batch.set(expenseRef, {
            id: expenseRef.id,
            merchantId,
            title: `Approvisionnement: ${productSnap.data().name}`,
            amount: cost,
            category: 'Stock',
            date: new Date(),
            createdAt: new Date()
          });
        }
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'stock_movements');
      }
    }
  },
  // --- Specialized SaaS Services ---
  interventions: {
    async save(intervention: any) {
      try {
        const id = intervention.id || doc(collection(db, 'interventions')).id;
        const docRef = doc(db, 'interventions', id);
        const data = { ...intervention, id, updatedAt: new Date(), createdAt: intervention.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'interventions');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'interventions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'interventions');
      }
    }
  },
  projects: {
    async save(project: any) {
      try {
        const id = project.id || doc(collection(db, 'projects')).id;
        const docRef = doc(db, 'projects', id);
        const data = { ...project, id, updatedAt: new Date(), createdAt: project.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'projects');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'projects');
      }
    }
  },
  vehicles: {
    async save(vehicle: any) {
      try {
        const id = vehicle.id || doc(collection(db, 'vehicles')).id;
        const docRef = doc(db, 'vehicles', id);
        const data = { ...vehicle, id, updatedAt: new Date(), createdAt: vehicle.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'vehicles');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'vehicles', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'vehicles');
      }
    }
  },
  employees: {
    async save(employee: any) {
      try {
        const id = employee.id || doc(collection(db, 'employees')).id;
        const docRef = doc(db, 'employees', id);
        const data = { ...employee, id, updatedAt: new Date(), createdAt: employee.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'employees');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'employees');
      }
    }
  },
  students: {
    async save(student: any) {
      try {
        const id = student.id || doc(collection(db, 'students')).id;
        const docRef = doc(db, 'students', id);
        const data = { ...student, id, updatedAt: new Date(), createdAt: student.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'students');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'students');
      }
    }
  },
  patients: {
    async save(patient: any) {
      try {
        const id = patient.id || doc(collection(db, 'patients')).id;
        const docRef = doc(db, 'patients', id);
        const data = { ...patient, id, updatedAt: new Date(), createdAt: patient.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'patients');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'patients', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'patients');
      }
    }
  },
  appointments: {
    async save(appointment: any) {
      try {
        const id = appointment.id || doc(collection(db, 'appointments')).id;
        const docRef = doc(db, 'appointments', id);
        const data = { ...appointment, id, updatedAt: new Date(), createdAt: appointment.id ? undefined : new Date() };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        await setDoc(docRef, data, { merge: true });
        return id;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'appointments');
      }
    },
    async delete(id: string) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'appointments');
      }
    }
  },
  async seedDatabase(onProgress?: (status: string) => void) {
    try {
      const batch = writeBatch(db);

      onProgress?.('Importation des services...');
      SERVICES.forEach(service => {
        const ref = doc(db, 'services', service.id);
        batch.set(ref, { ...service, updatedAt: new Date() });
      });

      onProgress?.('Importation des articles...');
      BLOG_POSTS.forEach(post => {
        const ref = doc(collection(db, 'blog_posts'));
        batch.set(ref, { ...post, id: ref.id, updatedAt: new Date(), created_at: new Date() });
      });

      onProgress?.('Importation du portfolio...');
      PORTFOLIO_ITEMS.forEach((item, index) => {
        const ref = doc(collection(db, 'portfolio'));
        batch.set(ref, { ...item, id: ref.id, order: index, updatedAt: new Date() });
      });

      onProgress?.('Configuration des réglages...');
      const settingsRef = doc(db, 'settings', 'global');
      batch.set(settingsRef, { ...DEFAULT_SETTINGS, updatedAt: new Date() });

      onProgress?.('Importation des catégories Studio ACOM...');
      INITIAL_CATEGORIES.forEach(cat => {
        const ref = doc(db, 'studio_acom_categories', cat.id);
        // We don't store the icon component in Firestore, just the ID
        const { icon, ...catData } = cat;
        batch.set(ref, { ...catData, updatedAt: new Date() });
      });

      onProgress?.('Importation des produits Studio ACOM...');
      INITIAL_PRODUCTS.forEach(product => {
        const ref = doc(db, 'studio_acom_products', product.id);
        batch.set(ref, { ...product, updatedAt: new Date() });
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Seed error:', error);
      throw error;
    }
  }
};
