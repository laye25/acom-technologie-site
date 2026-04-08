import { supabase } from '../lib/supabase';
import { Service, PortfolioItem, BlogPost } from '../types';

export const supabaseDbService = {
  services: {
    async getById(id: string) {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
      return data as BlogPost;
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
  studioAcom: {
    categories: {
      async save(category: any) {
        const id = category.id || crypto.randomUUID();
        const data = { ...category, id, updated_at: new Date() };
        const { error } = await supabase.from('studio_acom_categories').upsert(data);
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
        const { variants, ...productData } = product;
        
        const data = { ...productData, id, updated_at: new Date() };
        const { error: pError } = await supabase.from('studio_acom_products').upsert(data);
        if (pError) throw pError;

        if (variants && Array.isArray(variants)) {
          for (const variant of variants) {
            const vId = variant.id || crypto.randomUUID();
            const vData = { ...variant, id: vId, product_id: id, updated_at: new Date() };
            const { error: vError } = await supabase.from('variants').upsert(vData);
            if (vError) throw vError;
          }
        }
        return id;
      },
      async delete(id: string) {
        const { error } = await supabase.from('studio_acom_products').delete().eq('id', id);
        if (error) throw error;
      },
      async getVariants(productId: string) {
        const { data, error } = await supabase.from('variants').select('*').eq('product_id', productId);
        if (error) throw error;
        return data || [];
      }
    }
  },
  users: {
    async save(user: any) {
      const id = user.id || user.uid || crypto.randomUUID();
      const data = { ...user, id, updated_at: new Date() };
      const { error } = await supabase.from('users').upsert(data);
      if (error) throw error;
      return id;
    },
    async delete(id: string) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    }
  },
  designs: {
    async save(design: any) {
      const id = design.id || crypto.randomUUID();
      const data = { ...design, id, updated_at: new Date() };
      const { error } = await supabase.from('designs').upsert(data);
      if (error) throw error;
      return id;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('designs').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('designs').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
