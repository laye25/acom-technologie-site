import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db: any = null;

export const initSQLite = async () => {
  if (db) return db;

  try {
    const sqlite3 = await (sqlite3InitModule as any)({
      print: console.log,
      printErr: console.error,
    });

    console.log('SQLite loaded. Version:', sqlite3.version.libVersion);

    if ('opfs' in sqlite3) {
      db = new sqlite3.oo1.OpfsDb('/acom_studio.sqlite3');
      console.log('Using OPFS for SQLite persistence');
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
        updatedAt TEXT
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
    console.error('Failed to init SQLite:', e);
    return null;
  }
};

export const getSQLiteDB = () => db;

export const exportSQLiteDB = async () => {
  if (!db) return null;
  
  // For OPFS, we need to read the file from the origin private file system
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('acom_studio.sqlite3');
    const file = await fileHandle.getFile();
    return file;
  } catch (e) {
    console.warn('OPFS read failed, falling back to db.export():', e);
    // Fallback for non-OPFS or errors
    if (db.export) {
      const data = db.export(); 
      return new Blob([data], { type: 'application/x-sqlite3' });
    }
    return null;
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
    
    // Refresh page to re-init DB
    window.location.reload();
    return true;
  } catch (e) {
    console.error('SQLite restore failed:', e);
    return false;
  }
};

export const syncPhysicalFile = async () => {
  if (!db) return;
  try {
    const isElectron = typeof window !== 'undefined' && typeof (window as any).require !== 'undefined' && navigator.userAgent.includes('Electron');
    if (!isElectron) return;

    const fs = (window as any).require('fs');
    const path = (window as any).require('path');
    
    // Instead of directly using 'electron' which might be context isolated, 
    // we use APPDATA env var as fallback or just require
    const processVars = (window as any).process;
    if (!processVars) return;

    const appData = processVars.env.APPDATA || (processVars.platform === 'darwin' ? processVars.env.HOME + '/Library/Application Support' : '/var/local');
    const folderPath = path.join(appData, 'AcomGestion');
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const dbPath = path.join(folderPath, 'data.sqlite');
    
    // Export DB
    let uint8Array;
    if (db.export) {
        uint8Array = db.export();
    } else {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle('acom_studio.sqlite3');
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        uint8Array = new Uint8Array(arrayBuffer);
    }

    fs.writeFileSync(dbPath, uint8Array);
    console.log(`Database anchored to physical file: ${dbPath}`);
  } catch (e) {
    console.error('Failed to sync physical SQLite file:', e);
  }
};

export const sqliteHelper = {
  async insertProduct(product: any) {
    if (!db) await initSQLite();
    if (!db) return;
    
    db.exec({
      sql: 'INSERT OR REPLACE INTO merchant_products (id, merchantId, name, price, category, stock, syncStatus, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      bind: [
        product.id,
        product.merchantId || product.merchant_id,
        product.name,
        product.price || product.base_price || 0,
        product.category,
        product.stockQuantity || product.stock || 0,
        product.syncStatus,
        product.updatedAt?.toString() || new Date().toISOString()
      ]
    });
    await syncPhysicalFile();
  },

  async insertSale(sale: any) {
    if (!db) await initSQLite();
    if (!db) return;
    
    db.exec({
      sql: 'INSERT OR REPLACE INTO merchant_sales (id, merchantId, total, items, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      bind: [
        sale.id,
        sale.merchantId || sale.merchant_id,
        sale.total,
        JSON.stringify(sale.items || []),
        sale.syncStatus,
        sale.createdAt?.toString() || new Date().toISOString()
      ]
    });
    await syncPhysicalFile();
  },

  async insertExpense(expense: any) {
    if (!db) await initSQLite();
    if (!db) return;
    
    db.exec({
      sql: 'INSERT OR REPLACE INTO merchant_expenses (id, merchantId, title, amount, category, syncStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      bind: [
        expense.id,
        expense.merchantId || expense.merchant_id,
        expense.title,
        expense.amount,
        expense.category,
        expense.syncStatus,
        expense.createdAt?.toString() || new Date().toISOString()
      ]
    });
    await syncPhysicalFile();
  }
};
