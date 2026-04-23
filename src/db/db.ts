import Dexie, { Table } from 'dexie';
import { MerchantProduct, MerchantSale, MerchantExpense, Category } from '../types';

export class StudioAcomDB extends Dexie {
  categories!: Table<Category>;
  products!: Table<MerchantProduct>;
  sales!: Table<MerchantSale>;
  expenses!: Table<MerchantExpense>;
  merchants!: Table<any>;
  orders!: Table<any>;
  services!: Table<any>;
  users!: Table<any>;
  settings!: Table<any>;

  constructor() {
    super('StudioAcomDB');
    this.version(2).stores({
      categories: 'id, merchantId, name',
      products: 'id, merchantId, name, category',
      sales: 'id, merchantId, createdAt',
      expenses: 'id, merchantId, date, category',
      merchants: 'id, owner_id, name',
      orders: 'id, merchantId, createdAt, status',
      services: 'id, merchantId, name',
      users: 'id, merchantId, email',
      settings: 'id, merchantId'
    });
  }
}

export const db = new StudioAcomDB();
