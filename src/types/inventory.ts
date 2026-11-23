export const CATEGORY_IDS = [
  'electronics',
  'documents',
  'clothes',
  'kitchen',
  'other',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  label: string;
  description: string;
  icon: string;
  tint: string;
  color: string;
};

export type StorageLocation = {
  id: string;
  room: string;
  place: string;
  spot: string;
  createdAt: string;
  updatedAt: string;
};

export type StorageLocationInput = {
  room: string;
  place?: string;
  spot?: string;
};

export type Item = {
  id: string;
  name: string;
  category: CategoryId;
  location: string;
  locationId: string | null;
  notes: string;
  imageUri: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ItemImageChange =
  | { type: 'unchanged' }
  | { type: 'removed' }
  | { type: 'new'; sourceUri: string };

export type NewItemInput = {
  name: string;
  category: CategoryId;
  location: string;
  locationId?: string | null;
  notes: string;
  imageChange?: ItemImageChange;
};
