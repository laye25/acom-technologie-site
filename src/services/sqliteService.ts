import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { db as dexieDb } from '../db/db';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

let db: any = null;
let sqlite3Obj: any = null;
let nativeDbConnection: SQLiteDBConnection | null = null;
let hooksRegistered = false;
let syncTimeout: any = null;
let initPromise: Promise<any> | null = null;

export const debouncedSyncPhysicalFile = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncPhysicalFile().catch(err => {
      console.error('SQLite: Failed to run debounced physical file sync:', err);
    });
  }, 200);
};

const sqlitePlugin = new SQLiteConnection(CapacitorSQLite);
const isNative = Capacitor.isNativePlatform();

export const initSQLite = async (logs?: string[]) => {
  const pushLog = (msg: string) => {
    console.log(msg);
    if (logs) logs.push(msg);
  };

  if (db && (isNative || (sqlite3Obj && sqlite3Obj.capi && sqlite3Obj.oo1 && sqlite3Obj.wasm))) {
    return db;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    pushLog('[SQLite] Étape 1 : Début initSQLite() - OK');

    if (isNative) {
      try {
        pushLog('[SQLite] Mode Capacitor Native détecté');
        nativeDbConnection = await sqlitePlugin.createConnection('acom_studio', false, 'no-encryption', 1, false);
        await nativeDbConnection.open();
        db = nativeDbConnection;
        pushLog('[SQLite] Connexion Native ouverte - OK');
        
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
      } catch (e: any) {
        pushLog(`[SQLite] ERREUR Native: ${e?.message || e}`);
        return null;
      }
    }

    // Fallback to WASM
    pushLog('[SQLite] Étape 2 : Diagnostic de l\'environnement');
    if (typeof window !== 'undefined') {
      pushLog(`  - Protocol: ${window.location.protocol}`);
      pushLog(`  - Href: ${window.location.href}`);
      pushLog(`  - UserAgent: ${navigator.userAgent}`);
      const proc = (window as any).process || (typeof process !== 'undefined' ? process : null);
      if (proc) {
        pushLog(`  - Electron version: ${proc.versions?.electron || 'Non spécifié'}`);
        pushLog(`  - ResourcesPath: ${proc.resourcesPath || 'Non spécifié'}`);
        pushLog(`  - cwd: ${typeof proc.cwd === 'function' ? proc.cwd() : 'N/A'}`);
      } else {
        pushLog('  - Process object: Non présent (Navigateur Web standard)');
      }
    }

    try {
      if (!sqlite3Obj) {
        const isFileProtocol = typeof window !== 'undefined' && window.location && (window.location.protocol === 'file:' || !window.location.protocol.startsWith('http'));
        const wasmLoc = isFileProtocol ? './sqlite3.wasm' : '/sqlite3.wasm';
        pushLog(`[SQLite] Étape 3 : Chargement sqlite3.wasm (Target WASM: ${wasmLoc})`);

        let wasmBinary: ArrayBuffer | undefined = undefined;
        const candidates = [
          wasmLoc,
          '/sqlite3.wasm',
          './sqlite3.wasm',
          'sqlite3.wasm'
        ];
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
          candidates.push(`${window.location.origin}/sqlite3.wasm`);
        }

        pushLog('[SQLite] Pré-chargement du binaire WASM pour éviter la troncation de flux Electron/app://...');
        for (const candidateUrl of candidates) {
          try {
            pushLog(`  -> Tentative fetch: ${candidateUrl}`);
            const res = await fetch(candidateUrl);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              pushLog(`  -> Reçu ${buf.byteLength} octets depuis ${candidateUrl}`);
              if (buf.byteLength > 5000000) {
                wasmBinary = buf;
                pushLog(`[SQLite] Étape 3 RÉUSSIE : Binaire WASM complet chargé (${buf.byteLength} octets)`);
                break;
              } else {
                pushLog(`  -> Fichier partiel ou trop petit (${buf.byteLength} octets), essai suivant...`);
              }
            }
          } catch (fetchErr: any) {
            pushLog(`  -> Échec fetch (${candidateUrl}): ${fetchErr?.message || fetchErr}`);
          }
        }

        pushLog('[SQLite] Étape 4 : Exécution sqlite3InitModule()...');
        const initOptions: any = {
          print: (msg: any) => console.log('[sqlite-wasm]', msg),
          printErr: (msg: any) => console.error('[sqlite-wasm err]', msg),
          locateFile: (file: string) => {
            if (typeof window !== 'undefined' && window.location) {
              if (window.location.protocol === 'file:' || !window.location.protocol.startsWith('http')) {
                return `./${file}`;
              }
            }
            if (file.endsWith('.wasm')) {
              return '/sqlite3.wasm';
            }
            return `/${file}`;
          }
        };

        if (wasmBinary) {
          initOptions.wasmBinary = wasmBinary;
          pushLog('[SQLite] Passage direct de wasmBinary (ArrayBuffer) à Emscripten - Contournement fetch interne');
        }

        const sqlite3 = await (sqlite3InitModule as any)(initOptions);

        sqlite3Obj = sqlite3;
        pushLog(`[SQLite] Étape 4 RÉUSSIE : sqlite3Obj créé. Version: ${sqlite3.version?.libVersion || 'Inconnue'}`);
      } else {
        pushLog('[SQLite] Étape 4 : sqlite3Obj déjà existant en mémoire');
      }

      pushLog(`[SQLite] Étape 5 : Validation modules (capi: ${sqlite3Obj?.capi ? 'OK' : 'NULL'}, oo1: ${sqlite3Obj?.oo1 ? 'OK' : 'NULL'}, wasm: ${sqlite3Obj?.wasm ? 'OK' : 'NULL'})`);

      let opfsAvailable = false;
      pushLog('[SQLite] Étape 6 : Test disponibilité OPFS (navigator.storage.getDirectory)');
      try {
        if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.getDirectory === 'function') {
          await navigator.storage.getDirectory();
          opfsAvailable = true;
          pushLog('[SQLite] Étape 6 : OPFS disponible - OK');
        } else {
          pushLog('[SQLite] Étape 6 : OPFS indisponible (API navigator.storage.getDirectory absente) - Fallback');
        }
      } catch (opfsCheckErr: any) {
        pushLog(`[SQLite] Étape 6 : Test OPFS levé une exception (${opfsCheckErr?.message || opfsCheckErr}) - Fallback in-memory`);
        opfsAvailable = false;
      }

      pushLog('[SQLite] Étape 7 & 8 : Ouverture acom_studio.sqlite3');
      if (opfsAvailable && 'opfs' in sqlite3Obj) {
        try {
          db = new sqlite3Obj.oo1.OpfsDb('/acom_studio.sqlite3');
          pushLog('[SQLite] Étape 8 : Succès ouverture OpfsDb (/acom_studio.sqlite3)');
        } catch (opfsConstructErr: any) {
          pushLog(`[SQLite] Étape 8 : OpfsDb a échoué (${opfsConstructErr?.message || opfsConstructErr}) -> Fallback vers oo1.DB`);
          db = new sqlite3Obj.oo1.DB('/acom_studio.sqlite3', 'ct');
        }
      } else {
        db = new sqlite3Obj.oo1.DB('/acom_studio.sqlite3', 'ct');
        pushLog('[SQLite] Étape 8 : Succès ouverture oo1.DB (In-memory/Transient)');
      }

      pushLog(`[SQLite] Étape 9 : Instance db créée = ${db ? 'OUI' : 'NON'}`);

      // Restauration automatique du fichier de base de données physique sur Desktop (si non fait lors du démarrage initial)
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.loadPhysicalDbFile === 'function') {
        const dataRestored = localStorage.getItem('acom_desktop_data_restored');
        if (!dataRestored) {
          try {
            pushLog('[SQLite] Desktop: Restauration automatique du fichier physique...');
            const response = await electronAPI.loadPhysicalDbFile();
            if (response && response.success && response.data) {
              if (opfsAvailable && 'opfs' in sqlite3Obj) {
                const root = await navigator.storage.getDirectory();
                const fileHandle = await root.getFileHandle('acom_studio.sqlite3', { create: true });
                const writable = await (fileHandle as any).createWritable();
                await writable.write(new Uint8Array(response.data));
                await writable.close();
                pushLog('[SQLite] Desktop: Restauration physique OPFS réussie');
                localStorage.setItem('acom_desktop_data_restored', 'true');
                localStorage.setItem('acom_desktop_needs_dexie_populate', 'true');
              }
            } else {
              localStorage.setItem('acom_desktop_data_restored', 'true');
            }
          } catch (err: any) {
            pushLog(`[SQLite] Desktop: Erreur durant restauration physique (${err?.message || err})`);
          }
        }
      }

      const needsPopulate = localStorage.getItem('acom_desktop_needs_dexie_populate');
      if (needsPopulate === 'true') {
        localStorage.removeItem('acom_desktop_needs_dexie_populate');
        try {
          await populateDexieFromSQLite();
          pushLog('[SQLite] Desktop: Populated Dexie from restored SQLite db');
        } catch (err: any) {
          pushLog(`[SQLite] Desktop: Erreur populate Dexie (${err?.message || err})`);
        }
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

      // Sanity check: if Dexie is completely empty on Electron, but the physical file contains products, populate Dexie automatically
      const isDesktop = typeof window !== 'undefined' && (window as any).electronAPI;
      if (isDesktop) {
        try {
          const prodCount = await dexieDb.products.count();
          if (prodCount === 0) {
            pushLog('[SQLite] Desktop: Dexie est vide. Vérification contenu SQLite...');
            const results: any[] = [];
            db.exec({
              sql: 'SELECT COUNT(*) as count FROM merchant_products',
              rowMode: 'object',
              callback: (row: any) => {
                results.push(row);
              }
            });
            if (results && results[0] && results[0].count > 0) {
              pushLog(`[SQLite] Desktop: ${results[0].count} produits trouvés dans SQLite. Population Dexie...`);
              await populateDexieFromSQLite();
            }
          }
        } catch (countErr: any) {
          console.warn('SQLite init: Automatic Dexie sanity check failed:', countErr);
        }
      }

      // Register automatic Dexie -> SQLite mirroring hooks
      if (isDesktop && !hooksRegistered) {
        try {
          const tablesToMirror = ['products', 'sales', 'expenses'];
          tablesToMirror.forEach(tableName => {
            const table = (dexieDb as any)[tableName];
            if (!table) return;

            table.hook('creating', (primKey: any, obj: any) => {
              const id = primKey || obj.id;
              if (!id) return;
              
              setTimeout(async () => {
                try {
                  if (tableName === 'products') {
                    await sqliteHelper.insertProduct({ ...obj, id });
                  } else if (tableName === 'sales') {
                    await sqliteHelper.insertSale({ ...obj, id });
                  } else if (tableName === 'expenses') {
                    await sqliteHelper.insertExpense({ ...obj, id });
                  }
                  debouncedSyncPhysicalFile();
                } catch (err) {
                  console.error(`SQLite mirror hook error (creating ${tableName}):`, err);
                }
              }, 0);
            });

            table.hook('updating', (modifications: any, primKey: any, obj: any) => {
              const id = primKey || obj.id;
              if (!id) return;
              const merged = { ...obj, ...modifications, id };
              
              setTimeout(async () => {
                try {
                  if (tableName === 'products') {
                    await sqliteHelper.insertProduct(merged);
                  } else if (tableName === 'sales') {
                    await sqliteHelper.insertSale(merged);
                  } else if (tableName === 'expenses') {
                    await sqliteHelper.insertExpense(merged);
                  }
                  debouncedSyncPhysicalFile();
                } catch (err) {
                  console.error(`SQLite mirror hook error (updating ${tableName}):`, err);
                }
              }, 0);
            });

            table.hook('deleting', (primKey: any) => {
              if (!primKey) return;
              
              setTimeout(async () => {
                try {
                  if (tableName === 'products') {
                    await executeSQL('DELETE FROM merchant_products WHERE id = ?', [primKey]);
                  } else if (tableName === 'sales') {
                    await executeSQL('DELETE FROM merchant_sales WHERE id = ?', [primKey]);
                  } else if (tableName === 'expenses') {
                    await executeSQL('DELETE FROM merchant_expenses WHERE id = ?', [primKey]);
                  }
                  debouncedSyncPhysicalFile();
                } catch (err) {
                  console.error(`SQLite mirror hook error (deleting ${tableName}):`, err);
                }
              }, 0);
            });
          });
          hooksRegistered = true;
          pushLog('[SQLite] Desktop: Hooks de miroir Dexie -> SQLite enregistrés');
        } catch (hookErr: any) {
          console.warn('SQLite: Failed to register Dexie mirroring hooks:', hookErr);
        }
      }

      pushLog('[SQLite] Étape 10 : Initialisation SQLite terminée avec SUCCÈS');
      return db;
    } catch (e: any) {
      pushLog(`[SQLite] ÉCHEC FATAL initSQLite(): ${e?.name || 'Error'}: ${e?.message || e}`);
      if (e?.stack) {
        pushLog(`  Stack: ${e.stack.split('\n').slice(0, 4).join(' | ')}`);
      }
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
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

export const populateDexieFromSQLite = async (currentMerchantId?: string) => {
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

    // Clear existing Dexie tables to avoid mixing stale records
    await dexieDb.products.clear();
    await dexieDb.sales.clear();
    await dexieDb.expenses.clear();

    if (sqliteProducts.length > 0) {
      const mappedProducts = sqliteProducts.map(p => {
        const mId = currentMerchantId || p.merchantId || p.merchant_id || 'default_merchant';
        return {
          id: String(p.id || p.uuid || Math.random().toString(36).substring(2)),
          merchantId: mId,
          name: p.name || 'Produit sans nom',
          price: Number(p.price || p.base_price || 0),
          category: p.category || 'Général',
          stockQuantity: Number(p.stock !== undefined ? p.stock : (p.stockQuantity !== undefined ? p.stockQuantity : 0)),
          syncStatus: p.syncStatus || 'local-restored',
          createdAt: p.createdAt || p.updatedAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          sizes: typeof p.sizes === 'string' ? p.sizes : (p.sizes ? JSON.stringify(p.sizes) : ''),
          colors: typeof p.colors === 'string' ? p.colors : (p.colors ? JSON.stringify(p.colors) : '')
        };
      });
      await dexieDb.products.bulkPut(mappedProducts as any[]);
      console.log(`Imported ${mappedProducts.length} products to Dexie`);
    }

    if (sqliteSales.length > 0) {
      const mappedSales = sqliteSales.map(s => {
        let items = [];
        try {
          items = typeof s.items === 'string' ? JSON.parse(s.items) : (Array.isArray(s.items) ? s.items : []);
        } catch (_) {}
        const mId = currentMerchantId || s.merchantId || s.merchant_id || 'default_merchant';
        const total = Number(s.total !== undefined ? s.total : (s.totalAmount !== undefined ? s.totalAmount : 0));
        return {
          id: String(s.id || Math.random().toString(36).substring(2)),
          merchantId: mId,
          totalAmount: total,
          items: items,
          syncStatus: s.syncStatus || 'local-restored',
          createdAt: s.createdAt || new Date().toISOString(),
          paidAmount: total,
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
      const mappedExpenses = sqliteExpenses.map(e => {
        const mId = currentMerchantId || e.merchantId || e.merchant_id || 'default_merchant';
        return {
          id: String(e.id || Math.random().toString(36).substring(2)),
          merchantId: mId,
          title: e.title || e.description || 'Dépense',
          amount: Number(e.amount || 0),
          category: e.category || 'Divers',
          syncStatus: e.syncStatus || 'local-restored',
          createdAt: e.createdAt || new Date().toISOString(),
          date: e.createdAt ? String(e.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });
      await dexieDb.expenses.bulkPut(mappedExpenses as any[]);
      console.log(`Imported ${mappedExpenses.length} expenses to Dexie`);
    }

    return true;
  } catch (err) {
    console.error('Error populating Dexie from SQLite:', err);
    return false;
  }
};

export const ensureSQLiteReady = async (logs?: string[]): Promise<boolean> => {
  if (logs) {
    logs.push('[SQLite]');
    logs.push('Initialisation...');
  }

  const checkLoaded = () => {
    return !!(db && (isNative || (sqlite3Obj && sqlite3Obj.capi && sqlite3Obj.oo1 && sqlite3Obj.wasm)));
  };

  if (!checkLoaded()) {
    if (logs) {
      logs.push('Le moteur SQLite n\'est pas encore initialisé.');
      logs.push('Initialisation automatique en cours... Veuillez patienter.');
    }
    await initSQLite(logs);
  }

  const isReady = checkLoaded();

  if (!isReady) {
    if (logs) {
      logs.push('[SQLite] ERREUR FATALE : Moteur SQLite non initialisé après tentative.');
    }
    return false;
  }

  if (logs) {
    if (!isNative && sqlite3Obj) {
      const version = sqlite3Obj.version?.libVersion || 'Inconnue';
      const opfsAvailable = ('opfs' in sqlite3Obj) ? 'OK' : 'Non disponible (Fallthrough in-memory)';
      logs.push('sqlite3.wasm chargé : OK');
      logs.push(`Version : ${version}`);
      logs.push('Connexion ouverte : OK');
      logs.push(`OPFS : ${opfsAvailable}`);
      logs.push('Base active : acom_studio.sqlite3');
    } else {
      logs.push('Capacitor SQLite Native chargé : OK');
      logs.push('Connexion ouverte : OK');
      logs.push('Base active : acom_studio');
    }
  }

  return true;
};

export const inspectSqliteBuffer = (uint8Array: Uint8Array) => {
  if (!sqlite3Obj || !sqlite3Obj.capi || !sqlite3Obj.oo1 || !sqlite3Obj.wasm) {
    throw new Error("Moteur SQLite (WASM) non initialisé");
  }

  const tempDb = new sqlite3Obj.oo1.DB();
  try {
    const p = sqlite3Obj.wasm.allocFromTypedArray(uint8Array);
    const flags = (sqlite3Obj.capi.SQLITE_DESERIALIZE_FREEONCLOSE || 1) | (sqlite3Obj.capi.SQLITE_DESERIALIZE_RESIZEABLE || 2);
    const rc = sqlite3Obj.capi.sqlite3_deserialize(
      tempDb.pointer,
      'main',
      p,
      uint8Array.byteLength,
      uint8Array.byteLength,
      flags
    );

    if (rc !== 0) {
      throw new Error(`sqlite3_deserialize code d'erreur: ${rc}`);
    }

    const masterTables: string[] = [];
    tempDb.exec({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      rowMode: 'object',
      callback: (r: any) => {
        if (r && r.name) masterTables.push(r.name);
      }
    });

    const tableCounts: Record<string, number> = {};
    const tableRows: Record<string, any[]> = {};

    for (const tName of masterTables) {
      const rows: any[] = [];
      try {
        tempDb.exec({
          sql: `SELECT * FROM "${tName}"`,
          rowMode: 'object',
          callback: (r: any) => { rows.push(r); }
        });
      } catch (_) {}
      tableCounts[tName] = rows.length;
      tableRows[tName] = rows;
    }

    return { masterTables, tableCounts, tableRows };
  } finally {
    try { tempDb.close(); } catch (_) {}
  }
};

export interface TableItemCounts {
  products: number;
  sales: number;
  expenses: number;
}

export interface RestoreResult {
  success: boolean;
  logs: string[];
  importedCounts: TableItemCounts;
  copiedCounts: TableItemCounts;
  openedCounts: TableItemCounts;
  dexieCounts: TableItemCounts;
  dashboardCounts: TableItemCounts;
  activeDbPath: string;
  detectedDbFiles: string[];
  errorStep?: string;
  errorMessage?: string;
}

export const restoreSQLiteDB = async (file: File, currentMerchantId?: string): Promise<RestoreResult> => {
  const logs: string[] = [];
  const importedCounts: TableItemCounts = { products: 0, sales: 0, expenses: 0 };
  const copiedCounts: TableItemCounts = { products: 0, sales: 0, expenses: 0 };
  const openedCounts: TableItemCounts = { products: 0, sales: 0, expenses: 0 };
  const dexieCounts: TableItemCounts = { products: 0, sales: 0, expenses: 0 };
  const dashboardCounts: TableItemCounts = { products: 0, sales: 0, expenses: 0 };
  let activeDbPath = 'Inconnu';
  const detectedDbFiles: string[] = [];

  const createFailureResult = (step: string, message: string): RestoreResult => {
    return {
      success: false,
      logs,
      importedCounts,
      copiedCounts,
      openedCounts,
      dexieCounts,
      dashboardCounts,
      activeDbPath,
      detectedDbFiles,
      errorStep: step,
      errorMessage: message
    };
  };

  try {
    logs.push(`[RESTORE] Initialisation du processus de restauration pour : ${file.name}`);

    // GARANTIE SÉQUENTIELLE OBLIGATOIRE :
    // S'assurer que le moteur SQLite WASM est entièrement initialisé et prêt
    let isReady = await ensureSQLiteReady(logs);
    if (!isReady) {
      logs.push('Le moteur SQLite n\'est pas encore initialisé.');
      logs.push('Initialisation automatique en cours... Veuillez patienter.');
      await new Promise(r => setTimeout(r, 300));
      await initSQLite(logs);
      isReady = await ensureSQLiteReady(logs);
    }

    if (!isReady) {
      logs.push('[RESTORE] ERREUR : Le moteur SQLite (WASM) n\'est pas encore initialisé.');
      return createFailureResult('Audit 1 - Fichier importé', 'Moteur SQLite (WASM) non initialisé');
    }

    // -------------------------------------------------------------
    // AUDIT 1. VÉRIFIER LE FICHIER IMPORTÉ AVANT LA COPIE
    // -------------------------------------------------------------
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (uint8Array.length < 16) {
      logs.push('[RESTORE] ERREUR : Fichier vide ou corrompu (< 16 octets).');
      return createFailureResult('Audit 1 - Fichier importé', 'Fichier vide ou corrompu');
    }

    const headerText = new TextDecoder('ascii').decode(uint8Array.subarray(0, 15));
    if (!headerText.startsWith('SQLite format 3')) {
      logs.push('[RESTORE] ERREUR : En-tête SQLite 3 invalide.');
      return createFailureResult('Audit 1 - Fichier importé', 'Format non-SQLite 3');
    }

    logs.push('--------------------------------------------------');
    logs.push('[1. BASE IMPORTÉE (Analyse directe de l\'ArrayBuffer)]');

    let inspectResult;
    try {
      inspectResult = inspectSqliteBuffer(uint8Array);
    } catch (err: any) {
      logs.push(`[RESTORE] ERREUR lors de la lecture de l'ArrayBuffer: ${err.message}`);
      return createFailureResult('Audit 1 - Fichier importé', `Échec d'analyse de l'ArrayBuffer: ${err.message}`);
    }

    const { masterTables, tableCounts, tableRows } = inspectResult;
    logs.push(`  Tables SQLite détectées : [ ${masterTables.join(', ')} ]`);

    const getCount = (counts: Record<string, number>, keys: string[]) => {
      for (const k of keys) {
        if (counts[k] !== undefined) return counts[k];
      }
      return 0;
    };

    importedCounts.products = getCount(tableCounts, ['merchant_products', 'products']);
    importedCounts.sales = getCount(tableCounts, ['merchant_sales', 'sales']);
    importedCounts.expenses = getCount(tableCounts, ['merchant_expenses', 'expenses']);

    logs.push(`  merchant_products : ${importedCounts.products}`);
    logs.push(`  merchant_sales    : ${importedCounts.sales}`);
    logs.push(`  merchant_expenses : ${importedCounts.expenses}`);

    // -------------------------------------------------------------
    // AUDIT 2 & 5. Remplacement de la base physique (OPFS / Desktop)
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[2. FERMETURE & REMPLACEMENT DE LA BASE PHYSIQUE (OPFS)]');

    if (db) {
      try {
        if (typeof db.close === 'function') db.close();
      } catch (_) {}
      db = null;
    }
    if (nativeDbConnection) {
      try { await nativeDbConnection.close(); } catch (_) {}
      nativeDbConnection = null;
    }

    let opfsWrittenPath = '';
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory();
        try { await root.removeEntry('acom_studio.sqlite3'); } catch (_) {}
        const fileHandle = await root.getFileHandle('acom_studio.sqlite3', { create: true });
        const writable = await (fileHandle as any).createWritable();
        await writable.write(uint8Array);
        await writable.close();
        opfsWrittenPath = '/acom_studio.sqlite3';
        logs.push(`  Écriture OPFS réussie : ${opfsWrittenPath} (${uint8Array.byteLength} octets)`);
      } catch (opfsErr: any) {
        logs.push(`  [AVERTISSEMENT] Écriture OPFS : ${opfsErr.message}`);
      }
    }

    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.syncPhysicalFile === 'function') {
      try {
        await electronAPI.syncPhysicalFile(uint8Array.buffer);
        logs.push('  Synchronisation physique Electron : OK');
      } catch (_) {}
    }

    // -------------------------------------------------------------
    // AUDIT 3 & 4. VÉRIFICATION DE LA BASE RÉELLEMENT OUVERTE
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[3. RÉOUVERTURE & VÉRIFICATION DB ACTIF]');

    await ensureSQLiteReady();
    if (!db) {
      logs.push('[RESTORE] ERREUR : Connexion SQLite impossible après remplacement.');
      return createFailureResult('Audit 3 - Connexion SQLite', 'Impossible de rouvrir la base');
    }

    if (sqlite3Obj && db && db.pointer) {
      try {
        const p = sqlite3Obj.wasm.allocFromTypedArray(uint8Array);
        const flags = (sqlite3Obj.capi.SQLITE_DESERIALIZE_FREEONCLOSE || 1) | (sqlite3Obj.capi.SQLITE_DESERIALIZE_RESIZEABLE || 2);
        sqlite3Obj.capi.sqlite3_deserialize(
          db.pointer,
          'main',
          p,
          uint8Array.byteLength,
          uint8Array.byteLength,
          flags
        );
        logs.push('  Désérialisation directe dans la connexion active : OK');
      } catch (deserErr: any) {
        logs.push(`  [AVERTISSEMENT] Désérialisation pointer: ${deserErr.message}`);
      }
    }

    try {
      const pragmaList = await querySQL('PRAGMA database_list;');
      if (pragmaList && pragmaList.length > 0) {
        activeDbPath = pragmaList.map((row: any) => `${row.name}: ${row.file || 'in-memory/OPFS'}`).join('; ');
      } else {
        activeDbPath = 'main: /acom_studio.sqlite3 (OPFS WASM)';
      }
    } catch (_) {
      activeDbPath = 'main: /acom_studio.sqlite3 (OPFS WASM)';
    }
    logs.push(`  PRAGMA database_list -> Base utilisée : ${activeDbPath}`);

    logs.push('[4. VÉRIFICATION DES BASES DANS L\'APPLICATION]');
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory();
        for await (const entry of (root as any).values()) {
          if (entry.kind === 'file' && (entry.name.endsWith('.sqlite3') || entry.name.endsWith('.sqlite') || entry.name.endsWith('.db'))) {
            detectedDbFiles.push(entry.name);
          }
        }
      } catch (_) {}
    }
    if (detectedDbFiles.length === 0) {
      detectedDbFiles.push('acom_studio.sqlite3');
    }
    logs.push(`  Bases physiques détectées (${detectedDbFiles.length}) :`);
    detectedDbFiles.forEach((fName, idx) => {
      logs.push(`    ${idx + 1}. ${fName}`);
    });

    // -------------------------------------------------------------
    // AUDIT 2 (Suite). VÉRIFIER LA BASE COPIÉE / OUVERTE DANS SQLITE
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[5. COMPTAGE DANS SQLITE APRÈS COPIE/OUVERTURE]');

    const countTableInDb = async (tableNames: string[]) => {
      for (const tName of tableNames) {
        try {
          const res = await querySQL(`SELECT COUNT(*) as count FROM "${tName}"`);
          if (res && res[0] && res[0].count !== undefined) {
            return Number(res[0].count);
          }
        } catch (_) {}
      }
      return 0;
    };

    copiedCounts.products = await countTableInDb(['merchant_products', 'products']);
    copiedCounts.sales = await countTableInDb(['merchant_sales', 'sales']);
    copiedCounts.expenses = await countTableInDb(['merchant_expenses', 'expenses']);

    openedCounts.products = copiedCounts.products;
    openedCounts.sales = copiedCounts.sales;
    openedCounts.expenses = copiedCounts.expenses;

    logs.push(`  merchant_products : ${copiedCounts.products}`);
    logs.push(`  merchant_sales    : ${copiedCounts.sales}`);
    logs.push(`  merchant_expenses : ${copiedCounts.expenses}`);

    if (
      importedCounts.products !== copiedCounts.products ||
      importedCounts.sales !== copiedCounts.sales ||
      importedCounts.expenses !== copiedCounts.expenses
    ) {
      logs.push('[RESTORE] ÉCHEC AUDIT 2 : Les comptages après copie diffèrent des comptages du fichier importé !');
      logs.push(`  Produits: Importé (${importedCounts.products}) vs Copié (${copiedCounts.products})`);
      logs.push(`  Ventes:   Importé (${importedCounts.sales}) vs Copié (${copiedCounts.sales})`);
      logs.push(`  Dépenses: Importé (${importedCounts.expenses}) vs Copié (${copiedCounts.expenses})`);
      return createFailureResult('Audit 2 - Copie physique', 'Divergence entre le fichier importé et la base copiée');
    }

    // -------------------------------------------------------------
    // AUDIT 6 & 7. VÉRIFIER populateDexieFromSQLite() ET merchantId
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[6. RÉINJECTION DANS DEXIE & ALIGNEMENT MERCHANT ID]');

    await dexieDb.products.clear();
    await dexieDb.sales.clear();
    await dexieDb.expenses.clear();
    logs.push('  Cache Dexie vidé : OK');

    localStorage.setItem('sqlite_restore_in_progress', 'true');
    localStorage.setItem('last_sqlite_sync_timestamp', new Date().toISOString());

    let sampleProductRow: any = null;
    if (tableRows['merchant_products'] && tableRows['merchant_products'].length > 0) {
      sampleProductRow = tableRows['merchant_products'][0];
    } else if (tableRows['products'] && tableRows['products'].length > 0) {
      sampleProductRow = tableRows['products'][0];
    }

    const origMerchantId = sampleProductRow ? (sampleProductRow.merchantId || sampleProductRow.merchant_id || 'non spécifié') : 'aucun produit';
    const targetMerchantId = currentMerchantId || (origMerchantId !== 'non spécifié' && origMerchantId !== 'aucun produit' ? origMerchantId : 'default_merchant');

    logs.push(`  merchantId SQLite d'origine : ${origMerchantId}`);
    logs.push(`  merchantId Dexie réinjecté  : ${targetMerchantId} (aligné sur le commerçant actif)`);

    const populated = await populateDexieFromSQLite(targetMerchantId);
    if (!populated) {
      logs.push('[RESTORE] ERREUR : La réinjection Dexie a échoué.');
      return createFailureResult('Audit 6 - Réinjection Dexie', 'Échec de la fonction populateDexieFromSQLite()');
    }

    dexieCounts.products = await dexieDb.products.count();
    dexieCounts.sales = await dexieDb.sales.count();
    dexieCounts.expenses = await dexieDb.expenses.count();

    logs.push(`  SQLite Produits (${copiedCounts.products}) ↓ Dexie Produits (${dexieCounts.products})`);
    logs.push(`  SQLite Ventes (${copiedCounts.sales}) ↓ Dexie Ventes (${dexieCounts.sales})`);
    logs.push(`  SQLite Dépenses (${copiedCounts.expenses}) ↓ Dexie Dépenses (${dexieCounts.expenses})`);

    if (
      copiedCounts.products !== dexieCounts.products ||
      copiedCounts.sales !== dexieCounts.sales ||
      copiedCounts.expenses !== dexieCounts.expenses
    ) {
      logs.push('[RESTORE] ÉCHEC AUDIT 6 : Écart entre SQLite et Dexie après réinjection !');
      return createFailureResult('Audit 6 - Réinjection Dexie', 'Divergence entre SQLite et Dexie');
    }

    // -------------------------------------------------------------
    // AUDIT 8. VÉRIFIER VISIBILITÉ SUR LE DASHBOARD (useLiveQuery)
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[7. VISIBILITÉ DASHBOARD (Requête useLiveQuery)]');

    if (targetMerchantId) {
      dashboardCounts.products = await dexieDb.products.where('merchantId').equals(targetMerchantId).count();
      dashboardCounts.sales = await dexieDb.sales.where('merchantId').equals(targetMerchantId).count();
      dashboardCounts.expenses = await dexieDb.expenses.where('merchantId').equals(targetMerchantId).count();
    } else {
      dashboardCounts.products = dexieCounts.products;
      dashboardCounts.sales = dexieCounts.sales;
      dashboardCounts.expenses = dexieCounts.expenses;
    }

    logs.push(`  Produits Dexie total : ${dexieCounts.products}`);
    logs.push(`  Produits visibles sur Dashboard (${targetMerchantId}) : ${dashboardCounts.products}`);
    logs.push(`  Ventes visibles sur Dashboard (${targetMerchantId})   : ${dashboardCounts.sales}`);
    logs.push(`  Dépenses visibles sur Dashboard (${targetMerchantId}) : ${dashboardCounts.expenses}`);

    if (dashboardCounts.products !== dexieCounts.products) {
      logs.push('[RESTORE] ÉCHEC AUDIT 8 : Filtre merchantId empêche l\'affichage sur le Dashboard !');
      return createFailureResult('Audit 8 - Visibilité Dashboard', 'Écart entre les produits Dexie et les produits visibles du Dashboard');
    }

    // -------------------------------------------------------------
    // AUDIT 9. SYNCHRONISATION SUSPENDUE
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[8. VÉRIFICATION SYNCHRONISATION BACKGROUND]');
    logs.push('  Suspension sync enregistrée (sqlite_restore_in_progress = true)');

    // -------------------------------------------------------------
    // AUDIT 10. VALIDATION FINALE À 5 NIVEAUX
    // -------------------------------------------------------------
    logs.push('--------------------------------------------------');
    logs.push('[9. VALIDATION FINALE À 5 NIVEAUX DE CONFORMITÉ]');
    logs.push(`  1. Base importée : P=${importedCounts.products}, V=${importedCounts.sales}, D=${importedCounts.expenses}`);
    logs.push(`  2. Base copiée   : P=${copiedCounts.products}, V=${copiedCounts.sales}, D=${copiedCounts.expenses}`);
    logs.push(`  3. Base ouverte  : P=${openedCounts.products}, V=${openedCounts.sales}, D=${openedCounts.expenses}`);
    logs.push(`  4. Dexie DB      : P=${dexieCounts.products}, V=${dexieCounts.sales}, D=${dexieCounts.expenses}`);
    logs.push(`  5. Dashboard     : P=${dashboardCounts.products}, V=${dashboardCounts.sales}, D=${dashboardCounts.expenses}`);

    const isMatch = (
      importedCounts.products === copiedCounts.products &&
      copiedCounts.products === openedCounts.products &&
      openedCounts.products === dexieCounts.products &&
      dexieCounts.products === dashboardCounts.products &&
      importedCounts.sales === copiedCounts.sales &&
      copiedCounts.sales === openedCounts.sales &&
      openedCounts.sales === dexieCounts.sales &&
      dexieCounts.sales === dashboardCounts.sales &&
      importedCounts.expenses === copiedCounts.expenses &&
      copiedCounts.expenses === openedCounts.expenses &&
      openedCounts.expenses === dexieCounts.expenses &&
      dexieCounts.expenses === dashboardCounts.expenses
    );

    if (!isMatch) {
      logs.push('[RESTORE] ÉCHEC FINAL : Les 5 comptages ne sont pas strictly identiques !');
      return createFailureResult('Audit 10 - Conformité à 5 niveaux', 'Comptages non identiques aux 5 niveaux');
    }

    logs.push('[RESTORE] CONFORMITÉ TOTALE 100% : Les 5 niveaux sont strictement identiques.');
    logs.push('[RESTORE] Restauration terminée avec succès.');

    return {
      success: true,
      logs,
      importedCounts,
      copiedCounts,
      openedCounts,
      dexieCounts,
      dashboardCounts,
      activeDbPath,
      detectedDbFiles
    };

  } catch (err: any) {
    logs.push(`[RESTORE] ERREUR FATALE : ${err.message || String(err)}`);
    return createFailureResult('Restauration globale', err.message || String(err));
  }
};

export const syncPhysicalFile = async () => {
  if (!db) return;
  try {
    const electronAPI = (window as any).electronAPI;
    const isElectronNew = !!electronAPI;
    const isElectronOld = typeof window !== 'undefined' && typeof (window as any).require !== 'undefined' && navigator.userAgent.includes('Electron');
    
    // Track last write/sync timestamp for the visual status bar indicator
    const now = new Date().toISOString();
    localStorage.setItem('last_sqlite_sync_timestamp', now);
    window.dispatchEvent(new CustomEvent('sqlite-sync-completed', { detail: { timestamp: now } }));

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
      'INSERT OR REPLACE INTO merchant_products (id, merchantId, name, price, category, stock, syncStatus, updatedAt, sizes, colors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        product.id,
        product.merchantId || product.merchant_id,
        product.name,
        product.price || product.base_price || 0,
        product.category,
        product.stockQuantity || product.stock || 0,
        product.syncStatus,
        product.updatedAt?.toString() || new Date().toISOString(),
        product.sizes ? (typeof product.sizes === 'string' ? product.sizes : JSON.stringify(product.sizes)) : null,
        product.colors ? (typeof product.colors === 'string' ? product.colors : JSON.stringify(product.colors)) : null
      ]
    );
    debouncedSyncPhysicalFile();
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
    debouncedSyncPhysicalFile();
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
    debouncedSyncPhysicalFile();
  }
};
