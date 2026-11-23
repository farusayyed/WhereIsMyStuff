import { filterItems, getSearchTokens } from '../src/lib/items';
import type { Item } from '../src/types/inventory';

const items: Item[] = [
  {
    id: '1',
    name: 'Passport',
    category: 'documents',
    location: 'Bedroom closet, blue document box',
    locationId: null,
    notes: 'Stored with the birth certificates.',
    imageUri: null,
    isFavorite: false,
    createdAt: '2026-11-20T14:30:00.000Z',
    updatedAt: '2026-11-20T14:30:00.000Z',
  },
  {
    id: '2',
    name: 'Winter coat',
    category: 'clothes',
    location: 'Bedroom → Wardrobe → Top Drawer',
    locationId: null,
    notes: 'Navy wool coat with Blue cover bag.',
    imageUri: null,
    isFavorite: true,
    createdAt: '2026-11-18T18:05:00.000Z',
    updatedAt: '2026-11-18T18:05:00.000Z',
  },
  {
    id: '3',
    name: 'Laptop charger',
    category: 'electronics',
    location: 'Desk drawer, left side',
    locationId: null,
    notes: 'The spare USB-C charger.',
    imageUri: null,
    isFavorite: false,
    createdAt: '2026-11-19T09:15:00.000Z',
    updatedAt: '2026-11-21T09:15:00.000Z',
  },
];

const checks: Array<[string, boolean]> = [
  ['case-insensitive passport', filterItems(items, 'passport').length === 1],
  ['case-insensitive PASSPORT', filterItems(items, 'PASSPORT')[0]?.name === 'Passport'],
  ['trim spaces', filterItems(items, '  Passport  ')[0]?.name === 'Passport'],
  ['partial ward', filterItems(items, 'ward')[0]?.name === 'Winter coat'],
  ['location path Top Drawer', filterItems(items, 'top drawer')[0]?.name === 'Winter coat'],
  ['multi-word blue cover', filterItems(items, 'blue cover')[0]?.name === 'Winter coat'],
  ['category label Electronics', filterItems(items, 'Electronics')[0]?.name === 'Laptop charger'],
  [
    'search + category filter',
    filterItems(items, 'charger', 'electronics')[0]?.name === 'Laptop charger',
  ],
  ['search + wrong category', filterItems(items, 'passport', 'electronics').length === 0],
  ['cross-field passport bedroom', filterItems(items, 'passport bedroom')[0]?.name === 'Passport'],
  ['blank query returns all', filterItems(items, '   ').length === 3],
  ['no matches', filterItems(items, 'xylophone').length === 0],
  [
    'token split',
    JSON.stringify(getSearchTokens('  Blue   Cover ')) === JSON.stringify(['blue', 'cover']),
  ],
  ['edited item USB note', filterItems(items, 'usb')[0]?.name === 'Laptop charger'],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}`);
  if (!ok) {
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('All representative search checks passed.');
