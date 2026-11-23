import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  countItemsUsingLocation,
  deleteItem as deleteItemFromDb,
  deleteLocation as deleteLocationFromDb,
  getAllItems,
  getAllLocations,
  getErrorMessage,
  insertItem,
  insertLocation as insertLocationInDb,
  resetInventoryDatabaseConnection,
  toggleFavoriteItem as toggleFavoriteItemInDb,
  updateItem as updateItemInDb,
  updateLocation as updateLocationInDb,
} from '@/db/inventoryDb';
import { sortByNewest } from '@/lib/items';
import { formatLocationPath, sortLocations } from '@/lib/locations';
import type {
  Item,
  NewItemInput,
  StorageLocation,
  StorageLocationInput,
} from '@/types/inventory';

type InventoryStatus = 'loading' | 'ready' | 'error';

type InventoryContextValue = {
  items: Item[];
  locations: StorageLocation[];
  status: InventoryStatus;
  error: string | null;
  isSaving: boolean;
  getItem: (id: string) => Item | undefined;
  getLocation: (id: string) => StorageLocation | undefined;
  addItem: (input: NewItemInput) => Promise<Item>;
  updateItem: (id: string, input: NewItemInput) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Item>;
  addLocation: (input: StorageLocationInput) => Promise<StorageLocation>;
  updateLocation: (id: string, input: StorageLocationInput) => Promise<StorageLocation>;
  deleteLocation: (id: string) => Promise<void>;
  getLocationUsageCount: (id: string) => Promise<number>;
  refreshItems: () => Promise<void>;
  retryInitialization: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

type InventoryProviderProps = {
  children: ReactNode;
};

export function InventoryProvider({ children }: InventoryProviderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [status, setStatus] = useState<InventoryStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [nextItems, nextLocations] = await Promise.all([getAllItems(), getAllLocations()]);
      setItems(sortByNewest(nextItems));
      setLocations(sortLocations(nextLocations));
      setStatus('ready');
    } catch (loadError) {
      setItems([]);
      setLocations([]);
      setStatus('error');
      setError(getErrorMessage(loadError));
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const refreshItems = useCallback(async () => {
    if (status === 'error') {
      await loadInventory();
      return;
    }

    try {
      const [nextItems, nextLocations] = await Promise.all([getAllItems(), getAllLocations()]);
      setItems(sortByNewest(nextItems));
      setLocations(sortLocations(nextLocations));
      setStatus('ready');
      setError(null);
    } catch (refreshError) {
      setStatus('error');
      setError(getErrorMessage(refreshError));
    }
  }, [loadInventory, status]);

  const retryInitialization = useCallback(async () => {
    await resetInventoryDatabaseConnection();
    await loadInventory();
  }, [loadInventory]);

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items],
  );

  const getLocation = useCallback(
    (id: string) => locations.find((location) => location.id === id),
    [locations],
  );

  const addItem = useCallback(async (input: NewItemInput) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await insertItem(input);
      setItems((current) => sortByNewest([created, ...current]));
      return created;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const updateItem = useCallback(async (id: string, input: NewItemInput) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateItemInDb(id, input);
      setItems((current) =>
        sortByNewest(current.map((item) => (item.id === id ? updated : item))),
      );
      return updated;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const deleteItem = useCallback(async (id: string) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteItemFromDb(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const toggleFavorite = useCallback(async (id: string) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setError(null);

    try {
      const updated = await toggleFavoriteItemInDb(id);
      setItems((current) =>
        sortByNewest(current.map((item) => (item.id === id ? updated : item))),
      );
      return updated;
    } catch (toggleError) {
      const message = getErrorMessage(toggleError);
      setError(message);
      throw new Error(message);
    }
  }, [status]);

  const addLocation = useCallback(async (input: StorageLocationInput) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await insertLocationInDb(input);
      setLocations((current) => sortLocations([created, ...current]));
      return created;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const updateLocation = useCallback(async (id: string, input: StorageLocationInput) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateLocationInDb(id, input);
      const displayPath = formatLocationPath(updated);
      setLocations((current) =>
        sortLocations(current.map((location) => (location.id === id ? updated : location))),
      );
      setItems((current) =>
        sortByNewest(
          current.map((item) =>
            item.locationId === id
              ? {
                  ...item,
                  location: displayPath,
                  updatedAt: updated.updatedAt,
                }
              : item,
          ),
        ),
      );
      return updated;
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const deleteLocation = useCallback(async (id: string) => {
    if (status !== 'ready') {
      throw new Error('The local database is not ready yet.');
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteLocationFromDb(id);
      setLocations((current) => current.filter((location) => location.id !== id));
      setItems((current) =>
        current.map((item) =>
          item.locationId === id
            ? {
                ...item,
                locationId: null,
              }
            : item,
        ),
      );
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [status]);

  const getLocationUsageCount = useCallback(async (id: string) => {
    return countItemsUsingLocation(id);
  }, []);

  const value = useMemo(
    () => ({
      items,
      locations,
      status,
      error,
      isSaving,
      getItem,
      getLocation,
      addItem,
      updateItem,
      deleteItem,
      toggleFavorite,
      addLocation,
      updateLocation,
      deleteLocation,
      getLocationUsageCount,
      refreshItems,
      retryInitialization,
    }),
    [
      items,
      locations,
      status,
      error,
      isSaving,
      getItem,
      getLocation,
      addItem,
      updateItem,
      deleteItem,
      toggleFavorite,
      addLocation,
      updateLocation,
      deleteLocation,
      getLocationUsageCount,
      refreshItems,
      retryInitialization,
    ],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const value = useContext(InventoryContext);
  if (!value) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return value;
}
