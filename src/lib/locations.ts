import type { StorageLocation, StorageLocationInput } from '@/types/inventory';

export function normalizeLocationPart(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

export function formatLocationPath(input: {
  room: string;
  place?: string | null;
  spot?: string | null;
}): string {
  const parts = [
    normalizeLocationPart(input.room),
    normalizeLocationPart(input.place),
    normalizeLocationPart(input.spot),
  ].filter((part) => part.length > 0);

  return parts.join(' → ');
}

export function buildLocationPathKey(input: {
  room: string;
  place?: string | null;
  spot?: string | null;
}): string {
  return [
    normalizeLocationPart(input.room).toLowerCase(),
    normalizeLocationPart(input.place).toLowerCase(),
    normalizeLocationPart(input.spot).toLowerCase(),
  ].join('|');
}

export function sanitizeLocationInput(input: StorageLocationInput): StorageLocationInput {
  return {
    room: normalizeLocationPart(input.room),
    place: normalizeLocationPart(input.place),
    spot: normalizeLocationPart(input.spot),
  };
}

export function sortLocations(locations: StorageLocation[]): StorageLocation[] {
  return [...locations].sort((left, right) => {
    const leftLabel = formatLocationPath(left).toLowerCase();
    const rightLabel = formatLocationPath(right).toLowerCase();
    if (leftLabel === rightLabel) {
      return left.id < right.id ? -1 : 1;
    }
    return leftLabel < rightLabel ? -1 : 1;
  });
}
