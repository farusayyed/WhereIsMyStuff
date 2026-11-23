import { getCategory } from '@/data/categories';
import type { CategoryId, Item } from '@/types/inventory';

export function sortByNewest(items: Item[]): Item[] {
  return [...items].sort((left, right) => {
    if (left.createdAt === right.createdAt) {
      return left.id < right.id ? 1 : -1;
    }
    return left.createdAt < right.createdAt ? 1 : -1;
  });
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').toLowerCase();
}

/**
 * Builds one searchable string from the fields users expect to query.
 * Includes both the category label ("Documents") and id ("documents").
 */
export function getItemSearchText(item: Item): string {
  const category = getCategory(item.category);
  // Replace hierarchy separators so path parts like "Top Drawer" stay easy to match.
  const locationText = normalizeText(item.location).replace(/→/g, ' ');

  return [
    normalizeText(item.name),
    locationText,
    normalizeText(item.notes),
    normalizeText(category?.label),
    normalizeText(item.category),
  ]
    .filter((part) => part.length > 0)
    .join(' ');
}

export function getSearchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Case-insensitive search across name, location, notes, and category.
 * Leading/trailing spaces are ignored. Multiple words must each match
 * somewhere in the item's searchable text (partial matches allowed).
 */
export function filterItems(
  items: Item[],
  query: string,
  categoryId?: CategoryId | null,
): Item[] {
  let results = items;

  if (categoryId) {
    results = results.filter((item) => item.category === categoryId);
  }

  const tokens = getSearchTokens(query);
  if (tokens.length === 0) {
    return results;
  }

  return results.filter((item) => {
    const haystack = getItemSearchText(item);
    return tokens.every((token) => haystack.includes(token));
  });
}

export function itemsInCategory(items: Item[], categoryId: CategoryId): Item[] {
  return sortByNewest(items.filter((item) => item.category === categoryId));
}

export function formatAddedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAddedDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
