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
  activities!: Table<any>;
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
  teachers!: Table<any>;
  classes!: Table<any>;
  subjects!: Table<any>;
  grades!: Table<any>;
  parents!: Table<any>;
  attendance!: Table<any>;
  communications!: Table<any>;
  ai_insights!: Table<any>;
  schedules!: Table<any>;
  homeworks!: Table<any>;
  discipline_records!: Table<any>;

  constructor() {
    super('StudioAcomDB');
    this.version(19).stores({
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
      activities: 'id, merchantId, createdAt',
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
      design_requests: 'id, userId, createdAt',
      teachers: 'id, merchantId, username, updatedAt',
      classes: 'id, merchantId, updatedAt',
      subjects: 'id, merchantId, updatedAt',
      grades: 'id, merchantId, studentId, subjectId, teacherId, classId, syncStatus, updatedAt',
      parents: 'id, merchantId, studentId, phone, updatedAt',
      attendance: 'id, merchantId, studentId, classId, date, status, syncStatus, updatedAt',
      communications: 'id, merchantId, targetAudience, date, syncStatus, updatedAt',
      ai_insights: 'id, merchantId, studentId, type, date, syncStatus, updatedAt',
      schedules: 'id, merchantId, classId, dayOfWeek, syncStatus, updatedAt',
      homeworks: 'id, merchantId, classId, subjectId, dueDate, syncStatus, updatedAt',
      discipline_records: 'id, merchantId, studentId, type, date, syncStatus, updatedAt'
    });
  }
}

export const db = new StudioAcomDB();
