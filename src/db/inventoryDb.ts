import * as SQLite from 'expo-sqlite';

import { isCategoryId } from '@/data/categories';
import { sampleItems } from '@/data/sampleItems';
import {
  deletePhotoFileSafely,
  isManagedItemPhoto,
  persistItemPhoto,
} from '@/lib/itemPhotos';
import {
  buildLocationPathKey,
  formatLocationPath,
  sanitizeLocationInput,
  sortLocations,
} from '@/lib/locations';
import type {
  CategoryId,
  Item,
  ItemImageChange,
  NewItemInput,
  StorageLocation,
  StorageLocationInput,
} from '@/types/inventory';

const DATABASE_NAME = 'whereismystuff.db';
const SAMPLES_SEEDED_KEY = 'samples_seeded';

type ItemRow = {
  id: string;
  name: string;
  category: string;
  location: string;
  locationId: string | null;
  notes: string;
  imageUri: string | null;
  isFavorite: number | boolean | null;
  createdAt: string;
  updatedAt: string;
};

type LocationRow = {
  id: string;
  room: string;
  place: string;
  spot: string;
  pathKey: string;
  createdAt: string;
  updatedAt: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function mapRowToItem(row: ItemRow): Item {
  const category: CategoryId = isCategoryId(row.category) ? row.category : 'other';

  return {
    id: row.id,
    name: row.name,
    category,
    location: row.location,
    locationId: row.locationId ?? null,
    notes: row.notes,
    imageUri: row.imageUri ?? null,
    isFavorite: Boolean(row.isFavorite),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRowToLocation(row: LocationRow): StorageLocation {
  return {
    id: row.id,
    room: row.room,
    place: row.place,
    spot: row.spot,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      locationId TEXT,
      notes TEXT NOT NULL DEFAULT '',
      imageUri TEXT,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY NOT NULL,
      room TEXT NOT NULL,
      place TEXT NOT NULL DEFAULT '',
      spot TEXT NOT NULL DEFAULT '',
      pathKey TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await migrateSchema(db);
  await seedSampleItemsOnce(db);
  return db;
}

async function migrateSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  const itemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(items)');
  const itemColumnNames = new Set(itemColumns.map((column) => column.name));

  if (!itemColumnNames.has('imageUri')) {
    await db.execAsync('ALTER TABLE items ADD COLUMN imageUri TEXT');
  }

  if (!itemColumnNames.has('locationId')) {
    await db.execAsync('ALTER TABLE items ADD COLUMN locationId TEXT');
  }

  if (!itemColumnNames.has('isFavorite')) {
    await db.execAsync(
      'ALTER TABLE items ADD COLUMN isFavorite INTEGER NOT NULL DEFAULT 0',
    );
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY NOT NULL,
      room TEXT NOT NULL,
      place TEXT NOT NULL DEFAULT '',
      spot TEXT NOT NULL DEFAULT '',
      pathKey TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

export async function getInventoryDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = createDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function resetInventoryDatabaseConnection(): Promise<void> {
  if (databasePromise) {
    try {
      const db = await databasePromise;
      await db.closeAsync();
    } catch {
      // Ignore close errors while recovering from a failed or half-open connection.
    }
  }

  databasePromise = null;
}

async function getMetaValue(db: SQLite.SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

async function setMetaValue(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

async function seedSampleItemsOnce(db: SQLite.SQLiteDatabase): Promise<void> {
  const alreadySeeded = (await getMetaValue(db, SAMPLES_SEEDED_KEY)) === '1';
  if (alreadySeeded) {
    return;
  }

  const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM items');
  const hasExistingItems = (countRow?.count ?? 0) > 0;

  if (!hasExistingItems) {
    await db.withTransactionAsync(async () => {
      for (const item of sampleItems) {
        await db.runAsync(
          `INSERT OR IGNORE INTO items
            (id, name, category, location, locationId, notes, imageUri, isFavorite, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          item.name,
          item.category,
          item.location,
          item.locationId,
          item.notes,
          item.imageUri,
          item.isFavorite ? 1 : 0,
          item.createdAt,
          item.updatedAt,
        );
      }
    });
  }

  await setMetaValue(db, SAMPLES_SEEDED_KEY, '1');
}

async function countItemsUsingImage(
  db: SQLite.SQLiteDatabase,
  imageUri: string,
  excludeItemId?: string,
): Promise<number> {
  if (excludeItemId) {
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM items WHERE imageUri = ? AND id != ?',
      imageUri,
      excludeItemId,
    );
    return row?.count ?? 0;
  }

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM items WHERE imageUri = ?',
    imageUri,
  );
  return row?.count ?? 0;
}

async function deleteUnreferencedPhoto(
  db: SQLite.SQLiteDatabase,
  imageUri: string | null | undefined,
  excludeItemId?: string,
): Promise<void> {
  if (!imageUri || !isManagedItemPhoto(imageUri)) {
    return;
  }

  const remaining = await countItemsUsingImage(db, imageUri, excludeItemId);
  if (remaining === 0) {
    await deletePhotoFileSafely(imageUri);
  }
}

async function getLocationRowById(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<LocationRow | null> {
  return (
    (await db.getFirstAsync<LocationRow>(
      `SELECT id, room, place, spot, pathKey, createdAt, updatedAt
       FROM locations
       WHERE id = ?`,
      id,
    )) ?? null
  );
}

async function resolveItemLocation(
  db: SQLite.SQLiteDatabase,
  input: NewItemInput,
): Promise<{ location: string; locationId: string | null }> {
  if (input.locationId) {
    const saved = await getLocationRowById(db, input.locationId);
    if (!saved) {
      throw new Error('That saved storage location could not be found.');
    }

    return {
      locationId: saved.id,
      location: formatLocationPath(saved),
    };
  }

  const location = input.location.trim();
  if (!location) {
    throw new Error('Choose or create a storage location.');
  }

  return {
    locationId: null,
    location,
  };
}

export async function getAllItems(): Promise<Item[]> {
  const db = await getInventoryDatabase();
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT id, name, category, location, locationId, notes, imageUri, isFavorite, createdAt, updatedAt
     FROM items
     ORDER BY createdAt DESC`,
  );

  return rows.map(mapRowToItem);
}

export async function getItemById(id: string): Promise<Item | null> {
  const db = await getInventoryDatabase();
  const row = await db.getFirstAsync<ItemRow>(
    `SELECT id, name, category, location, locationId, notes, imageUri, isFavorite, createdAt, updatedAt
     FROM items
     WHERE id = ?`,
    id,
  );

  return row ? mapRowToItem(row) : null;
}

export async function getAllLocations(): Promise<StorageLocation[]> {
  const db = await getInventoryDatabase();
  const rows = await db.getAllAsync<LocationRow>(
    `SELECT id, room, place, spot, pathKey, createdAt, updatedAt
     FROM locations`,
  );

  return sortLocations(rows.map(mapRowToLocation));
}

export async function getLocationById(id: string): Promise<StorageLocation | null> {
  const db = await getInventoryDatabase();
  const row = await getLocationRowById(db, id);
  return row ? mapRowToLocation(row) : null;
}

export async function countItemsUsingLocation(locationId: string): Promise<number> {
  const db = await getInventoryDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM items WHERE locationId = ?',
    locationId,
  );
  return row?.count ?? 0;
}

export async function insertLocation(input: StorageLocationInput): Promise<StorageLocation> {
  const db = await getInventoryDatabase();
  const sanitized = sanitizeLocationInput(input);

  if (!sanitized.room) {
    throw new Error('Enter a room name for this location.');
  }

  const pathKey = buildLocationPathKey(sanitized);
  const existing = await db.getFirstAsync<LocationRow>(
    'SELECT id, room, place, spot, pathKey, createdAt, updatedAt FROM locations WHERE pathKey = ?',
    pathKey,
  );

  if (existing) {
    throw new Error('That storage location already exists.');
  }

  const now = new Date().toISOString();
  const location: StorageLocation = {
    id: createId('loc'),
    room: sanitized.room,
    place: sanitized.place ?? '',
    spot: sanitized.spot ?? '',
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO locations (id, room, place, spot, pathKey, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    location.id,
    location.room,
    location.place,
    location.spot,
    pathKey,
    location.createdAt,
    location.updatedAt,
  );

  return location;
}

export async function updateLocation(
  id: string,
  input: StorageLocationInput,
): Promise<StorageLocation> {
  const db = await getInventoryDatabase();
  const existing = await getLocationRowById(db, id);

  if (!existing) {
    throw new Error('That storage location could not be found.');
  }

  const sanitized = sanitizeLocationInput(input);
  if (!sanitized.room) {
    throw new Error('Enter a room name for this location.');
  }

  const pathKey = buildLocationPathKey(sanitized);
  const duplicate = await db.getFirstAsync<LocationRow>(
    'SELECT id FROM locations WHERE pathKey = ? AND id != ?',
    pathKey,
    id,
  );

  if (duplicate) {
    throw new Error('Another storage location already uses that path.');
  }

  const updatedAt = new Date().toISOString();
  const location: StorageLocation = {
    id,
    room: sanitized.room,
    place: sanitized.place ?? '',
    spot: sanitized.spot ?? '',
    createdAt: existing.createdAt,
    updatedAt,
  };
  const displayPath = formatLocationPath(location);

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `UPDATE locations
       SET room = ?, place = ?, spot = ?, pathKey = ?, updatedAt = ?
       WHERE id = ?`,
      location.room,
      location.place,
      location.spot,
      pathKey,
      location.updatedAt,
      location.id,
    );

    if (result.changes === 0) {
      throw new Error('That storage location could not be updated.');
    }

    await db.runAsync(
      `UPDATE items
       SET location = ?, updatedAt = ?
       WHERE locationId = ?`,
      displayPath,
      updatedAt,
      location.id,
    );
  });

  return location;
}

export async function deleteLocation(id: string): Promise<void> {
  const db = await getInventoryDatabase();
  const existing = await getLocationRowById(db, id);

  if (!existing) {
    throw new Error('That storage location could not be found.');
  }

  await db.withTransactionAsync(async () => {
    // Keep the readable path on items so search/details still work after the
    // reusable location record is removed.
    await db.runAsync(
      `UPDATE items
       SET locationId = NULL
       WHERE locationId = ?`,
      id,
    );

    const result = await db.runAsync('DELETE FROM locations WHERE id = ?', id);
    if (result.changes === 0) {
      throw new Error('That storage location could not be deleted.');
    }
  });
}

export async function insertItem(input: NewItemInput): Promise<Item> {
  const db = await getInventoryDatabase();
  const now = new Date().toISOString();
  const id = createId('item');
  const imageChange: ItemImageChange = input.imageChange ?? { type: 'unchanged' };
  const resolvedLocation = await resolveItemLocation(db, input);

  let imageUri: string | null = null;
  if (imageChange.type === 'new') {
    imageUri = await persistItemPhoto(imageChange.sourceUri, id);
  }

  const item: Item = {
    id,
    name: input.name.trim(),
    category: input.category,
    location: resolvedLocation.location,
    locationId: resolvedLocation.locationId,
    notes: input.notes.trim(),
    imageUri,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.runAsync(
      `INSERT INTO items
        (id, name, category, location, locationId, notes, imageUri, isFavorite, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.category,
      item.location,
      item.locationId,
      item.notes,
      item.imageUri,
      item.isFavorite ? 1 : 0,
      item.createdAt,
      item.updatedAt,
    );
  } catch (error) {
    if (imageUri) {
      await deletePhotoFileSafely(imageUri);
    }
    throw error;
  }

  return item;
}

export async function updateItem(id: string, input: NewItemInput): Promise<Item> {
  const db = await getInventoryDatabase();
  const existing = await getItemById(id);

  if (!existing) {
    throw new Error('That item could not be found in the local database.');
  }

  const imageChange: ItemImageChange = input.imageChange ?? { type: 'unchanged' };
  const previousImageUri = existing.imageUri;
  let nextImageUri = previousImageUri;
  let newlyPersistedUri: string | null = null;
  const resolvedLocation = await resolveItemLocation(db, input);

  if (imageChange.type === 'new') {
    newlyPersistedUri = await persistItemPhoto(imageChange.sourceUri, id);
    nextImageUri = newlyPersistedUri;
  } else if (imageChange.type === 'removed') {
    nextImageUri = null;
  }

  const updatedAt = new Date().toISOString();
  const item: Item = {
    id: existing.id,
    name: input.name.trim(),
    category: input.category,
    location: resolvedLocation.location,
    locationId: resolvedLocation.locationId,
    notes: input.notes.trim(),
    imageUri: nextImageUri,
    isFavorite: existing.isFavorite,
    createdAt: existing.createdAt,
    updatedAt,
  };

  try {
    const result = await db.runAsync(
      `UPDATE items
       SET name = ?, category = ?, location = ?, locationId = ?, notes = ?, imageUri = ?, updatedAt = ?
       WHERE id = ?`,
      item.name,
      item.category,
      item.location,
      item.locationId,
      item.notes,
      item.imageUri,
      item.updatedAt,
      item.id,
    );

    if (result.changes === 0) {
      throw new Error('That item could not be updated in the local database.');
    }
  } catch (error) {
    if (newlyPersistedUri) {
      await deletePhotoFileSafely(newlyPersistedUri);
    }
    throw error;
  }

  if (previousImageUri && previousImageUri !== nextImageUri) {
    await deleteUnreferencedPhoto(db, previousImageUri);
  }

  return item;
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getInventoryDatabase();
  const existing = await getItemById(id);

  if (!existing) {
    throw new Error('That item could not be found or was already deleted.');
  }

  const result = await db.runAsync('DELETE FROM items WHERE id = ?', id);

  if (result.changes === 0) {
    throw new Error('That item could not be found or was already deleted.');
  }

  await deleteUnreferencedPhoto(db, existing.imageUri);
}

export async function toggleFavoriteItem(id: string): Promise<Item> {
  const db = await getInventoryDatabase();
  const existing = await getItemById(id);

  if (!existing) {
    throw new Error('That item could not be found in the local database.');
  }

  const updatedAt = new Date().toISOString();
  const isFavorite = !existing.isFavorite;
  const result = await db.runAsync(
    `UPDATE items
     SET isFavorite = ?, updatedAt = ?
     WHERE id = ?`,
    isFavorite ? 1 : 0,
    updatedAt,
    id,
  );

  if (result.changes === 0) {
    throw new Error('That item could not be updated in the local database.');
  }

  return {
    ...existing,
    isFavorite,
    updatedAt,
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong while using the local database.';
}
