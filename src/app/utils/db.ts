// IndexedDB wrapper for LinkBoard data persistence
const DB_NAME = 'LinkBoardDB';
const DB_VERSION = 1;
const LINKS_STORE = 'links';
const CATEGORIES_STORE = 'categories';

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: number;
  notes?: string;
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create links store
      if (!db.objectStoreNames.contains(LINKS_STORE)) {
        const linksStore = db.createObjectStore(LINKS_STORE, { keyPath: 'id' });
        linksStore.createIndex('category', 'category', { unique: false });
        linksStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create categories store
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'name' });
      }
    };
  });
}

// Links operations
export async function saveLinks(links: Link[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(LINKS_STORE, 'readwrite');
  const store = tx.objectStore(LINKS_STORE);

  // Clear existing links
  await store.clear();

  // Add all links
  for (const link of links) {
    await store.add(link);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLinks(): Promise<Link[]> {
  const db = await openDB();
  const tx = db.transaction(LINKS_STORE, 'readonly');
  const store = tx.objectStore(LINKS_STORE);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addLink(link: Link): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(LINKS_STORE, 'readwrite');
  const store = tx.objectStore(LINKS_STORE);

  await store.add(link);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLink(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(LINKS_STORE, 'readwrite');
  const store = tx.objectStore(LINKS_STORE);

  await store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateLink(link: Link): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(LINKS_STORE, 'readwrite');
  const store = tx.objectStore(LINKS_STORE);

  await store.put(link);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Categories operations
export async function saveCategories(categories: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CATEGORIES_STORE, 'readwrite');
  const store = tx.objectStore(CATEGORIES_STORE);

  // Clear existing categories
  await store.clear();

  // Add all categories
  for (const category of categories) {
    await store.add({ name: category });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCategories(): Promise<string[]> {
  const db = await openDB();
  const tx = db.transaction(CATEGORIES_STORE, 'readonly');
  const store = tx.objectStore(CATEGORIES_STORE);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      const categories = request.result?.map((item: { name: string }) => item.name) || [];
      resolve(categories);
    };
    request.onerror = () => reject(request.error);
  });
}

// Migration from localStorage
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Check if data exists in localStorage
    const localStorageLinks = localStorage.getItem('linkboard-links');
    const localStorageCategories = localStorage.getItem('linkboard-categories');

    if (localStorageLinks || localStorageCategories) {
      // Parse and migrate links
      if (localStorageLinks) {
        const links: Link[] = JSON.parse(localStorageLinks);
        await saveLinks(links);
      }

      // Parse and migrate categories
      if (localStorageCategories) {
        const categories: string[] = JSON.parse(localStorageCategories);
        await saveCategories(categories);
      }

      // Mark migration as complete
      localStorage.setItem('linkboard-migrated', 'true');

      // Optionally remove old data
      // localStorage.removeItem('linkboard-links');
      // localStorage.removeItem('linkboard-categories');
    }
  } catch (error) {
    console.error('Migration from localStorage failed:', error);
    throw error;
  }
}

// Check if migration is needed
export function needsMigration(): boolean {
  return !localStorage.getItem('linkboard-migrated') &&
         (!!localStorage.getItem('linkboard-links') || !!localStorage.getItem('linkboard-categories'));
}
