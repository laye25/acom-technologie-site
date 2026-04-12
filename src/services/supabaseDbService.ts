import { firestoreService } from './firestoreService';
import { Service, PortfolioItem, BlogPost } from '../types';

export const supabaseDbService = {
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
    async save(post: Partial<BlogPost>) {
      return firestoreService.save('blog_posts', post);
    },
    async delete(id: string) {
      return firestoreService.delete('blog_posts', id);
    }
  },
  studioAcom: {
    categories: {
      async save(category: any) {
        return firestoreService.save('studio_acom_categories', category);
      },
      async delete(id: string) {
        return firestoreService.delete('studio_acom_categories', id);
      }
    },
    products: {
      async save(product: any) {
        const { variants, ...productData } = product;
        const id = await firestoreService.save('studio_acom_products', productData);

        if (variants && Array.isArray(variants)) {
          for (const variant of variants) {
            await firestoreService.save('variants', { ...variant, product_id: id });
          }
        }
        return id;
      },
      async delete(id: string) {
        return firestoreService.delete('studio_acom_products', id);
      },
      async getVariants(productId: string) {
        return []; // Simplified
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
