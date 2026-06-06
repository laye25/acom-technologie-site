import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { db as dexieDb } from '../db/db';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

let db: any = null;
let sqlite3Obj: any = null;
let nativeDbConnection: SQLiteDBConnection | null = null;
const sqlitePlugin = new SQLiteConnection(CapacitorSQLite);
const isNative = Capacitor.isNativePlatform();

export const initSQLite = async () => {
  if (db) return db;

  if (isNative) {
    try {
      console.log('Initializing native Capacitor SQLite...');
      nativeDbConnection = await sqlitePlugin.createConnection('acom_studio', false, 'no-encryption', 1, false);
      await nativeDbConnection.open();
      db = nativeDbConnection;
      
      // Setup tables for native
      await db.execute(`
        CREATE TABLE IF NOT EXISTS merchant_products (
          id TEXT PRIMARY KEY,
          merchantId TEXT,
          name TEXT,
          price REAL,
          category TEXT,
          stock INTEGER,
          syncStatus TEXT,
          updatedAt TEXT,
          sizes TEXT,
          colors TEXT
        );

        CREATE TABLE IF NOT EXISTS merchant_sales (
          id TEXT PRIMARY KEY,
          merchantId TEXT,
          total REAL,
          items TEXT,
          syncStatus TEXT,
          createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS merchant_expenses (
          id TEXT PRIMARY KEY,
          merchantId TEXT,
          title TEXT,
          amount REAL,
          category TEXT,
          syncStatus TEXT,
          createdAt TEXT
        );
      `);
      return db;
    } catch (e) {
      console.error('Failed to init native SQLite:', e);
      return null;
    }
  }

  // Fallback to WASM
  try {
    const sqlite3 = await (sqlite3InitModule as any)({
      print: console.log,
      printErr: console.error,
      locateFile: (file: string) => {
        const isDesktop = typeof window !== 'undefined' && (
          ('__TAURI__' in window) || 
          (window.process && (window.process as any).type) || 
          (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
          (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
        );
        if (isDesktop) {
          if (file.endsWith('.wasm')) {
            return '/sqlite3.wasm';
          }
          return `/${file}`;
        }
        if (file.endsWith('.wasm')) {
          return '/sqlite3.wasm';
        }
        return `/${file}`;
      }
    });

    sqlite3Obj = sqlite3;
    console.log('SQLite loaded. Version:', sqlite3.version.libVersion);

    if ('opfs' in sqlite3) {
      try {
        db = new sqlite3.oo1.OpfsDb('/acom_studio.sqlite3');
        console.log('Using OPFS for SQLite persistence');
      } catch (opfsErr) {
        console.warn('Failed to construct OpfsDb, falling back to in-memory oo1.DB:', opfsErr);
        db = new sqlite3.oo1.DB('/acom_studio.sqlite3', 'ct');
      }
    } else {
      db = new sqlite3.oo1.DB('/acom_studio.sqlite3', 'ct');
      console.log('Using transient/In-memory store (Fallthrough)');
    }

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS merchant_products (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        name TEXT,
        price REAL,
        category TEXT,
        stock INTEGER,
        syncStatus TEXT,
        updatedAt TEXT,
        sizes TEXT,
        colors TEXT
      );

      CREATE TABLE IF NOT EXISTS merchant_sales (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        total REAL,
        items TEXT,
        syncStatus TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS merchant_expenses (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        title TEXT,
        amount REAL,
        category TEXT,
        syncStatus TEXT,
        createdAt TEXT
      );
    `);

    // Run safe migrations for existing desktop databases
    try {
      db.exec("ALTER TABLE merchant_products ADD COLUMN sizes TEXT;");
    } catch (_) {}
    try {
      db.exec("ALTER TABLE merchant_products ADD COLUMN colors TEXT;");
    } catch (_) {}

    return db;
  } catch (e) {
    console.error('Failed to init SQLite:', e);
    return null;
  }
};

export const getSQLiteDB = () => db;

// Helper to execute non-query SQL (inserts, updates, schema creation, transactions)
export const executeSQL = async (sql: string, bind: any[] = []): Promise<void> => {
  if (!db) await initSQLite();
  if (!db) {
    console.warn("Database connection is not available for executeSQL");
    return;
  }

  if (isNative) {
    try {
      if (bind && bind.length > 0) {
        await db.run(sql, bind);
      } else {
        await db.execute(sql);
      }
    } catch (err) {
      console.error("Native SQLite execution failed for SQL:", sql, err);
      throw err;
    }
  } else {
    try {
      if (bind && bind.length > 0) {
        db.exec({ sql, bind });
      } else {
        db.exec(sql);
      }
    } catch (err) {
      console.error("WASM SQLite execution failed for SQL:", sql, err);
      throw err;
    }
  }
};

// Helper to query/select data from SQLite
export const querySQL = async (sql: string, bind: any[] = []): Promise<any[]> => {
  if (!db) await initSQLite();
  if (!db) {
    console.warn("Database connection is not available for querySQL");
    return [];
  }

  if (isNative) {
    try {
      const res = await db.query(sql, bind);
      return res.values || [];
    } catch (err) {
      console.error("Native SQLite query failed for SQL:", sql, err);
      throw err;
    }
  } else {
    try {
      const results: any[] = [];
      db.exec({
        sql,
        bind,
        rowMode: 'object',
        callback: (row: any) => {
          results.push(row);
        }
      });
      return results;
    } catch (err) {
      console.error("WASM SQLite query failed for SQL:", sql, err);
      throw err;
    }
  }
};

export const populateSQLiteFromDexie = async (merchantId: string) => {
  if (!db) await initSQLite();
  if (!db) {
    console.warn("SQLite database not initialized, skipping Dexie populate");
    return false;
  }

  try {
    // 1. Get products, sales, expenses from Dexie
    const products = await dexieDb.products.where('merchantId').equals(merchantId).toArray() || [];
    const sales = await dexieDb.sales.where('merchantId').equals(merchantId).toArray() || [];
    const expenses = await dexieDb.expenses.where('merchantId').equals(merchantId).toArray() || [];

    // Ensure the db contains the tables
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS merchant_products (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        name TEXT,
        price REAL,
        category TEXT,
        stock INTEGER,
        syncStatus TEXT,
        updatedAt TEXT,
        sizes TEXT,
        colors TEXT
      );

      CREATE TABLE IF NOT EXISTS merchant_sales (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        total REAL,
        items TEXT,
        syncStatus TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS merchant_expenses (
        id TEXT PRIMARY KEY,
        merchantId TEXT,
        title TEXT,
        amount REAL,
        category TEXT,
        syncStatus TEXT,
        createdAt TEXT
      );
    `);

    // Run safe migrations for existing desktop databases
    try {
      await executeSQL("ALTER TABLE merchant_products ADD COLUMN sizes TEXT;");
    } catch (_) {}
    try {
      await executeSQL("ALTER TABLE merchant_products ADD COLUMN colors TEXT;");
    } catch (_) {}

    // Insert all into SQLite in a single transaction
    await executeSQL('BEGIN TRANSACTION;');

    for (const p of products) {
      const pAny = p as any;
      await executeSQL(
        'INSERT OR REPLACE INTO merchant_products (id, merchantId, name, price, category, stock, syncStatus, updatedAt, sizes, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          pAny.id,
          pAny.merchantId,
          pAny.name,
          pAny.price || 0,
          pAny.category || '',
          pAny.stockQuantity || 0,
          pAny.syncStatus || 'local-only',
          pAny.updatedAt?.toString() || new Date().toISOString(),
          pAny.sizes || '',
          pAny.colors || ''
        ]
      );
    }

    for (const s of sales) {
      const sAny = s as any;
      await executeSQL(
        'INSERT OR REPLACE INTO merchant_sales (id, merchantId, total, items, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          sAny.id,
          sAny.merchantId,
          sAny.totalAmount || sAny.total || 0,
          JSON.stringify(sAny.items || []),
          sAny.syncStatus || 'local-only',
          sAny.createdAt?.toString() || new Date().toISOString()
        ]
      );
    }

    for (const e of expenses) {
      const eAny = e as any;
      await executeSQL(
        'INSERT OR REPLACE INTO merchant_expenses (id, merchantId, title, amount, category, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          eAny.id,
          eAny.merchantId,
          eAny.title || eAny.description || '',
          eAny.amount || 0,
          eAny.category || '',
          eAny.syncStatus || 'local-only',
          eAny.createdAt?.toString() || new Date().toISOString()
        ]
      );
    }

    await executeSQL('COMMIT;');
    await syncPhysicalFile();
    return true;
  } catch (err) {
    console.error('Error populating SQLite from Dexie:', err);
    try {
      await executeSQL('ROLLBACK;');
    } catch (_) {}
    return false;
  }
};

export const exportSQLiteDB = async (merchantId: string) => {
  if (!db) {
    try {
      await initSQLite();
    } catch (e) {
      console.error('Failed to initialize SQLite on export request:', e);
    }
  }

  if (db && merchantId) {
    try {
      await populateSQLiteFromDexie(merchantId);
    } catch (e) {
      console.warn('Could not populate SQLite database file from Dexie before export:', e);
    }
  }
  
  // Attempt to export directly using JS DB Export CAPI (works for both OPFS and in-memory databases seamlessly)
  if (db && sqlite3Obj && sqlite3Obj.capi && sqlite3Obj.capi.sqlite3_js_db_export) {
    try {
      const data = sqlite3Obj.capi.sqlite3_js_db_export(db.pointer);
      if (data) {
        return new Blob([data], { type: 'application/x-sqlite3' });
      }
    } catch (exportErr) {
      console.warn('CAPI db export failed, trying OPFS fallback:', exportErr);
    }
  }
  
  // For OPFS, we need to read the file from the origin private file system
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('acom_studio.sqlite3');
    const file = await fileHandle.getFile();
    return file;
  } catch (e) {
    console.warn('OPFS read failed, falling back to db.export():', e);
    // Fallback for non-OPFS or errors
    if (db && typeof db.export === 'function') {
      try {
        const data = db.export(); 
        return new Blob([data], { type: 'application/x-sqlite3' });
      } catch (exportErr) {
        console.error('db.export fallback failed:', exportErr);
      }
    }
    return null;
  }
};

export const populateDexieFromSQLite = async () => {
  if (!db) await initSQLite();
  if (!db) {
    console.warn("SQLite database not initialized, cannot populate Dexie");
    return false;
  }

  try {
    console.log("Populating Dexie from SQLite data...");
    
    // 1. Read merchant's products
    let sqliteProducts: any[] = [];
    try {
      sqliteProducts = await querySQL('SELECT * FROM merchant_products');
    } catch (e) {
      console.warn("No products found or table does not exist in SQLite:", e);
    }

    // 2. Read merchant's sales
    let sqliteSales: any[] = [];
    try {
      sqliteSales = await querySQL('SELECT * FROM merchant_sales');
    } catch (e) {
      console.warn("No sales found or table does not exist in SQLite:", e);
    }

    // 3. Read merchant's expenses
    let sqliteExpenses: any[] = [];
    try {
      sqliteExpenses = await querySQL('SELECT * FROM merchant_expenses');
    } catch (e) {
      console.warn("No expenses found or table does not exist in SQLite:", e);
    }

    // Map and migrate to Dexie
    // Clear existing data to prevent merging old local data with the restored data
    await dexieDb.products.clear();
    await dexieDb.sales.clear();
    await dexieDb.expenses.clear();

    if (sqliteProducts.length > 0) {
      const mappedProducts = sqliteProducts.map(p => ({
        id: p.id,
        merchantId: p.merchantId,
        name: p.name,
        price: Number(p.price || 0),
        category: p.category,
        stockQuantity: Number(p.stock || 0),
        syncStatus: p.syncStatus || 'local-only',
        createdAt: p.updatedAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
        sizes: p.sizes || '',
        colors: p.colors || ''
      }));
      await dexieDb.products.bulkPut(mappedProducts as any[]);
      console.log(`Imported ${mappedProducts.length} products to Dexie`);
    }

    if (sqliteSales.length > 0) {
      const mappedSales = sqliteSales.map(s => {
        let items = [];
        try {
          items = s.items ? JSON.parse(s.items) : [];
        } catch (_) {}
        return {
          id: s.id,
          merchantId: s.merchantId,
          totalAmount: Number(s.total || s.totalAmount || 0),
          items: items,
          syncStatus: s.syncStatus || 'local-only',
          createdAt: s.createdAt || new Date().toISOString(),
          paidAmount: Number(s.total || s.totalAmount || 0),
          balance: 0,
          payments: [],
          paymentMethod: 'cash' as const,
          processedBy: 'local'
        };
      });
      await dexieDb.sales.bulkPut(mappedSales as any[]);
      console.log(`Imported ${mappedSales.length} sales to Dexie`);
    }

    if (sqliteExpenses.length > 0) {
      const mappedExpenses = sqliteExpenses.map(e => ({
        id: e.id,
        merchantId: e.merchantId,
        title: e.title,
        amount: Number(e.amount || 0),
        category: e.category,
        syncStatus: e.syncStatus || 'local-only',
        createdAt: e.createdAt || new Date().toISOString(),
        date: e.createdAt ? e.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      await dexieDb.expenses.bulkPut(mappedExpenses as any[]);
      console.log(`Imported ${mappedExpenses.length} expenses to Dexie`);
    }

    return true;
  } catch (err) {
    console.error('Error populating Dexie from SQLite:', err);
    return false;
  }
};

export const restoreSQLiteDB = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('acom_studio.sqlite3', { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(uint8Array);
    await writable.close();
    
    // Close current DB handle to let sqlite reload the new physical file
    if (db) {
      try {
        db.close();
      } catch (closeErr) {
        console.warn('Failed to close open DB handle upon restore:', closeErr);
      }
      db = null;
    }
    
    // Force initialize the loaded SQLite database
    await initSQLite();
    
    // Import SQLite database rows back into local Dexie IndexedDB
    await populateDexieFromSQLite();
    
    // Refresh page to re-init full UI with the loaded data
    window.location.reload();
    return true;
  } catch (e) {
    console.error('SQLite restore/import failed:', e);
    return false;
  }
};

export const syncPhysicalFile = async () => {
  if (!db) return;
  try {
    const electronAPI = (window as any).electronAPI;
    const isElectronNew = !!electronAPI;
    const isElectronOld = typeof window !== 'undefined' && typeof (window as any).require !== 'undefined' && navigator.userAgent.includes('Electron');
    
    if (!isElectronNew && !isElectronOld) return;

    // Export DB
    let uint8Array: Uint8Array;
    if (db.export) {
        uint8Array = db.export();
    } else {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle('acom_studio.sqlite3');
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        uint8Array = new Uint8Array(arrayBuffer);
    }

    if (isElectronNew && typeof electronAPI.syncPhysicalFile === 'function') {
      console.log('Syncing SQLite via secure Electron IPC bridge...');
      const result = await electronAPI.syncPhysicalFile(uint8Array.buffer);
      console.log('IPC sync result:', result);
      return;
    }

    if (isElectronOld) {
      const fs = (window as any).require('fs');
      const path = (window as any).require('path');
      const processVars = (window as any).process;
      if (!processVars) return;

      const appData = processVars.env.APPDATA || (processVars.platform === 'darwin' ? processVars.env.HOME + '/Library/Application Support' : '/var/local');
      const folderPath = path.join(appData, 'AcomGestion');
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const dbPath = path.join(folderPath, 'data.sqlite');
      fs.writeFileSync(dbPath, uint8Array);
      console.log(`Database anchored to physical file (fallback): ${dbPath}`);
    }
  } catch (e) {
    console.error('Failed to sync physical SQLite file:', e);
  }
};

export const sqliteHelper = {
  async insertProduct(product: any) {
    await executeSQL(
      'INSERT OR REPLACE INTO merchant_products (id, merchantId, name, price, category, stock, syncStatus, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        product.id,
        product.merchantId || product.merchant_id,
        product.name,
        product.price || product.base_price || 0,
        product.category,
        product.stockQuantity || product.stock || 0,
        product.syncStatus,
        product.updatedAt?.toString() || new Date().toISOString()
      ]
    );
    await syncPhysicalFile();
  },

  async insertSale(sale: any) {
    await executeSQL(
      'INSERT OR REPLACE INTO merchant_sales (id, merchantId, total, items, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [
        sale.id,
        sale.merchantId || sale.merchant_id,
        sale.total,
        JSON.stringify(sale.items || []),
        sale.syncStatus,
        sale.createdAt?.toString() || new Date().toISOString()
      ]
    );
    await syncPhysicalFile();
  },

  async insertExpense(expense: any) {
    await executeSQL(
      'INSERT OR REPLACE INTO merchant_expenses (id, merchantId, title, amount, category, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        expense.id,
        expense.merchantId || expense.merchant_id,
        expense.title,
        expense.amount,
        expense.category,
        expense.syncStatus,
        expense.createdAt?.toString() || new Date().toISOString()
      ]
    );
    await syncPhysicalFile();
  }
};
