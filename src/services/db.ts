// IndexedDB service wrapper for app data

const DB_NAME = 'fbr_invoice_app';
const DB_VERSION = 1;

export const STORE_NAMES = {
  sellers: 'sellers',
  buyers: 'buyers',
  invoices: 'invoices',
  products: 'products',
  preferences: 'preferences',
  logs: 'logs',
} as const;

export type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES];

type IDBObject = Record<string, any>;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.sellers)) {
        db.createObjectStore(STORE_NAMES.sellers, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.buyers)) {
        db.createObjectStore(STORE_NAMES.buyers, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.products)) {
        db.createObjectStore(STORE_NAMES.products, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.invoices)) {
        db.createObjectStore(STORE_NAMES.invoices, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.preferences)) {
        db.createObjectStore(STORE_NAMES.preferences, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.logs)) {
        db.createObjectStore(STORE_NAMES.logs, { keyPath: 'timestamp' });
      }
    };
  });
}

async function withStore<T = any>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => T | Promise<T>
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction([storeName], mode);
    const store = tx.objectStore(storeName);

    Promise.resolve(runner(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
}

export async function dbGetAll<T = IDBObject>(storeName: StoreName): Promise<T[]> {
  return withStore(storeName, 'readonly', (store) => {
    return new Promise<T[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function dbGet<T = IDBObject>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return withStore(storeName, 'readonly', (store) => {
    return new Promise<T | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function dbPut<T = IDBObject>(storeName: StoreName, value: T): Promise<IDBValidKey> {
  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const request = store.put(value as any);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export async function dbDelete(storeName: StoreName, key: IDBValidKey): Promise<void> {
  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export async function dbBulkPut<T = IDBObject>(storeName: StoreName, values: T[]): Promise<void> {
  return withStore(storeName, 'readwrite', async (store) => {
    await Promise.all(values.map((v) => new Promise<void>((resolve, reject) => {
      const req = store.put(v as any);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })));
  });
}

export async function dbClear(storeName: StoreName): Promise<void> {
  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}