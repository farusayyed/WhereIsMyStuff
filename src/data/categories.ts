import type { Category, CategoryId } from '@/types/inventory';

export const categories: Category[] = [
  {
    id: 'electronics',
    label: 'Electronics',
    description: 'Cables, chargers, gadgets, and spare parts.',
    icon: '📱',
    tint: '#E0F2FE',
    color: '#0369A1',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Papers, IDs, manuals, and important folders.',
    icon: '📄',
    tint: '#EDE9FE',
    color: '#6D28D9',
  },
  {
    id: 'clothes',
    label: 'Clothes',
    description: 'Seasonal clothes, shoes, and accessories.',
    icon: '👕',
    tint: '#FEF3C7',
    color: '#B45309',
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    description: 'Tools, containers, and items stored around the kitchen.',
    icon: '🍳',
    tint: '#FFE4E6',
    color: '#BE123C',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Anything that does not fit the other categories.',
    icon: '📦',
    tint: '#E2E8F0',
    color: '#334155',
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function isCategoryId(value: string): value is CategoryId {
  return categories.some((category) => category.id === value);
}
