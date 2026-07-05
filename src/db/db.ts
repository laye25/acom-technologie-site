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
  prescriptions!: Table<any>;
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
  vehicle_maintenances!: Table<any>;
  delivery_agents!: Table<any>;
  delivery_assignments!: Table<any>;

  constructor() {
    super('StudioAcomDB');
    this.version(21).stores({
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
      prescriptions: 'id, merchantId, patientId, appointmentId, updatedAt',
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
      parents: 'id, merchantId, studentId, phone, username, updatedAt',
      attendance: 'id, merchantId, studentId, classId, date, status, syncStatus, updatedAt',
      communications: 'id, merchantId, targetAudience, date, syncStatus, updatedAt',
      ai_insights: 'id, merchantId, studentId, type, date, syncStatus, updatedAt',
      schedules: 'id, merchantId, classId, dayOfWeek, syncStatus, updatedAt',
      homeworks: 'id, merchantId, classId, subjectId, dueDate, syncStatus, updatedAt',
      discipline_records: 'id, merchantId, studentId, type, date, syncStatus, updatedAt',
      vehicle_maintenances: 'id, merchantId, vehicleId, date, syncStatus, updatedAt',
      delivery_agents: 'id, merchantId, syncStatus, updatedAt',
      delivery_assignments: 'id, merchantId, ticketId, agentId, status, syncStatus, updatedAt'
    });
  }
}

export const db = new StudioAcomDB();

// Shared flag to disable database hooks during pulls (downward syncs)
export let isSyncingFromRemote = false;

export function setRemoteSyncState(state: boolean) {
  isSyncingFromRemote = state;
}

// Hook to sync local offline writes to Firestore
if (typeof window !== 'undefined') {
  const OFFLINE_SYNC_TABLES = [
    'classes',
    'subjects',
    'grades',
    'attendance',
    'communications',
    'ai_insights',
    'schedules',
    'homeworks',
    'discipline_records',
    'students',
    'teachers',
    'parents',
    'vehicle_maintenances',
    'delivery_agents',
    'delivery_assignments'
  ];

  OFFLINE_SYNC_TABLES.forEach(tableName => {
    const table = (db as any)[tableName];
    if (!table) return;

    table.hook('creating', (primKey: any, obj: any) => {
      if (isSyncingFromRemote) return;
      // Push to Firestore asynchronously
      import('../services/firestoreService').then(({ firestoreService }) => {
        const id = primKey || obj.id || crypto.randomUUID();
        const dataToSave = {
          ...obj,
          id,
          merchant_id: obj.merchantId || obj.merchant_id || '',
          merchantId: obj.merchantId || obj.merchant_id || ''
        };
        firestoreService.save(tableName, dataToSave).catch(err => {
          console.error(`Auto-creating remote document for [${tableName}] failed:`, err);
        });
      }).catch(err => {
        console.error('Failed to import firestoreService in Dexie hook:', err);
      });
    });

    table.hook('updating', (modifications: any, primKey: any, obj: any) => {
      if (isSyncingFromRemote) return;
      import('../services/firestoreService').then(({ firestoreService }) => {
        const id = primKey || obj.id;
        if (!id) return;
        const updatedObj = {
          ...obj,
          ...modifications,
          id,
          merchant_id: modifications.merchantId || obj.merchantId || obj.merchant_id || '',
          merchantId: modifications.merchantId || obj.merchantId || obj.merchant_id || ''
        };
        firestoreService.save(tableName, updatedObj).catch(err => {
          console.error(`Auto-updating remote document for [${tableName}] failed:`, err);
        });
      }).catch(err => {
        console.error('Failed to import firestoreService in Dexie hook:', err);
      });
    });

    table.hook('deleting', (primKey: any) => {
      if (isSyncingFromRemote) return;
      import('../services/firestoreService').then(({ firestoreService }) => {
        if (!primKey) return;
        firestoreService.delete(tableName, primKey).catch(err => {
          console.error(`Auto-deleting remote document for [${tableName}] failed:`, err);
        });
      }).catch(err => {
        console.error('Failed to import firestoreService in Dexie hook:', err);
      });
    });
  });
}
