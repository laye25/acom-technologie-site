import Dexie, { Table } from 'dexie';
import { MerchantProduct, MerchantSale, MerchantExpense, Category } from '../types';

export class StudioAcomDB extends Dexie {
  categories!: Table<Category>;
  products!: Table<MerchantProduct>;
  sales!: Table<MerchantSale>;
  quotes!: Table<any>;
  expenses!: Table<MerchantExpense>;
  merchants!: Table<any>;
  orders!: Table<any>;
  services!: Table<any>;
  users!: Table<any>;
  settings!: Table<any>;
  messages!: Table<any>;
  notifications!: Table<any>;
  blog_posts!: Table<any>;
  portfolio_items!: Table<any>;
  interventions!: Table<any>;
  projects!: Table<any>;
  vehicles!: Table<any>;
  employees!: Table<any>;
  students!: Table<any>;
  patients!: Table<any>;
  appointments!: Table<any>;
  suppliers!: Table<any>;
  movements!: Table<any>;
  partner_ratings!: Table<any>;
  designs!: Table<any>;
  assets!: Table<any>;
  templates!: Table<any>;
  design_blocks!: Table<any>;
  studio_acom_categories!: Table<any>;
  studio_acom_products!: Table<any>;
  variants!: Table<any>;
  design_requests!: Table<any>;

  constructor() {
    super('StudioAcomDB');
    this.version(14).stores({
      categories: 'id, merchantId, name, syncStatus',
      products: 'id, merchantId, name, category, updatedAt, syncStatus',
      sales: 'id, merchantId, createdAt, syncStatus',
      quotes: 'id, merchantId, createdAt, status, syncStatus',
      expenses: 'id, merchantId, createdAt, date, category, syncStatus',
      merchants: 'id, owner_id, name, updatedAt',
      orders: 'id, merchantId, userId, user_id, partnerId, partner_id, createdAt, status, updatedAt',
      services: 'id, merchantId, name, updatedAt',
      designs: 'id, merchantId, ownerId, updatedAt',
      users: 'id, merchantId, email, role, updatedAt',
      settings: 'id, merchantId, updatedAt',
      messages: 'id, orderId, senderId, chatId, createdAt',
      notifications: 'id, userId, createdAt, read',
      blog_posts: 'id, date, category, updatedAt',
      portfolio_items: 'id, category, updatedAt',
      interventions: 'id, merchantId, updatedAt',
      projects: 'id, merchantId, updatedAt',
      vehicles: 'id, merchantId, updatedAt',
      employees: 'id, merchantId, updatedAt',
      students: 'id, merchantId, updatedAt',
      patients: 'id, merchantId, updatedAt',
      appointments: 'id, merchantId, updatedAt',
      suppliers: 'id, merchantId, updatedAt',
      movements: 'id, merchantId, createdAt',
      partner_ratings: 'id, partnerId, updatedAt',
      assets: 'id, userId, updatedAt',
      templates: 'id, category, updatedAt',
      design_blocks: 'id, designId, pageIndex',
      studio_acom_categories: 'id, name',
      studio_acom_products: 'id, categoryId, name',
      variants: 'id, productId, name',
      design_requests: 'id, userId, createdAt'
    });
  }
}

export const db = new StudioAcomDB();
