import {
  Project,
  StoryBibleEntry,
  Character,
  CharacterRelationship,
  Location,
  Episode,
  StoryUnit,
  TimelineEvent,
  Secret,
  Clue,
  OpenLoop,
  StoryObject,
  ContinuityLogEntry,
  StoryDecision,
  GenerationRun,
  DatabaseSchema,
} from '../types/database';

const DB_NAME = 'kateb_al_warith_relational_db';
const DB_VERSION = 3;
const LOCALSTORAGE_MIRROR_KEY = 'kateb_al_warith_relational_backup_v2';

export const STORE_NAMES = [
  'projects',
  'story_bible',
  'characters',
  'character_relationships',
  'locations',
  'episodes',
  'story_units',
  'timeline_events',
  'secrets',
  'clues',
  'open_loops',
  'objects',
  'continuity_log',
  'story_decisions',
  'generation_runs',
  'system_prompts',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

let dbInstance: IDBDatabase | null = null;

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available, will use localStorage fallback');
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          if (storeName !== 'projects' && storeName !== 'character_relationships') {
            store.createIndex('project_id', 'project_id', { unique: false });
          }
          if (storeName === 'story_units') {
            store.createIndex('episode_id', 'episode_id', { unique: false });
          }
          if (storeName === 'clues') {
            store.createIndex('secret_id', 'secret_id', { unique: false });
          }
        }
      });
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };
  });
};

// Mirroring helper for localStorage backup
export const getLocalBackup = (): DatabaseSchema => {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_MIRROR_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading localStorage backup', e);
  }
  return {
    projects: [],
    story_bible: [],
    characters: [],
    character_relationships: [],
    locations: [],
    episodes: [],
    story_units: [],
    timeline_events: [],
    secrets: [],
    clues: [],
    open_loops: [],
    objects: [],
    continuity_log: [],
    story_decisions: [],
    generation_runs: [],
    system_prompts: [],
  };
};

export const saveLocalBackup = (data: DatabaseSchema) => {
  try {
    localStorage.setItem(LOCALSTORAGE_MIRROR_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed writing localStorage backup', e);
  }
};

// Generic CRUD operations
export async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Fallback to localStorage backup
    const backup = getLocalBackup();
    return (backup[storeName as keyof DatabaseSchema] as unknown as T[]) || [];
  }
}

export async function putItem<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  // Update localStorage mirror first for safety
  const backup = getLocalBackup();
  const list = (backup[storeName as keyof DatabaseSchema] as unknown as T[]) || [];
  const idx = list.findIndex(x => x.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  (backup[storeName as keyof DatabaseSchema] as unknown as T[]) = list;
  saveLocalBackup(backup);

  // Update IndexedDB
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // IndexedDB failure handled by localStorage mirror
    console.warn(`IndexedDB put failed for ${storeName}, mirrored in localStorage`, e);
  }
}

export async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  // Update localStorage mirror
  const backup = getLocalBackup();
  const list = (backup[storeName as keyof DatabaseSchema] as unknown as { id: string }[]) || [];
  (backup[storeName as keyof DatabaseSchema] as unknown as { id: string }[]) = list.filter(x => x.id !== id);
  saveLocalBackup(backup);

  // Update IndexedDB
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB delete failed for ${storeName}, mirrored in localStorage`, e);
  }
}

export async function loadFullDatabase(): Promise<DatabaseSchema> {
  try {
    const db = await openDatabase();
    const result: Partial<DatabaseSchema> = {};

    for (const storeName of STORE_NAMES) {
      const items = await getAllItems(storeName);
      (result as any)[storeName] = items;
    }

    const loaded = result as DatabaseSchema;
    // If IndexedDB had nothing but localStorage had backup, hydrate
    const local = getLocalBackup();
    let isIdbEmpty = true;
    for (const key of STORE_NAMES) {
      if (loaded[key] && loaded[key].length > 0) {
        isIdbEmpty = false;
        break;
      }
    }

    if (isIdbEmpty) {
      let isLocalEmpty = true;
      for (const key of STORE_NAMES) {
        if (local[key] && local[key].length > 0) {
          isLocalEmpty = false;
          break;
        }
      }
      if (!isLocalEmpty) {
        // Hydrate from localStorage into IndexedDB
        for (const storeName of STORE_NAMES) {
          const items = local[storeName] || [];
          for (const item of items) {
            await putItem(storeName, item);
          }
        }
        return local;
      }
    }

    saveLocalBackup(loaded);
    return loaded;
  } catch (e) {
    return getLocalBackup();
  }
}
