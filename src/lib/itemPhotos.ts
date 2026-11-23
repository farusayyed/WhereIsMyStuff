import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';

const PHOTOS_DIRECTORY_NAME = 'item-photos';

function getPhotosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIRECTORY_NAME);
}

export function ensurePhotosDirectory(): Directory {
  const photosDir = getPhotosDirectory();
  if (!photosDir.exists) {
    photosDir.create({ intermediates: true, idempotent: true });
  }
  return photosDir;
}

function guessExtension(sourceUri: string): string {
  const cleanUri = sourceUri.split('?')[0] ?? sourceUri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(cleanUri);
  if (!match?.[1]) {
    return '.jpg';
  }

  const extension = match[1].toLowerCase();
  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(extension)) {
    return `.${extension === 'jpeg' ? 'jpg' : extension}`;
  }

  return '.jpg';
}

/**
 * Copies a picker/camera temp URI into permanent document storage.
 * Returns the permanent local file URI stored for the item.
 */
export async function persistItemPhoto(sourceUri: string, itemId: string): Promise<string> {
  const photosDir = ensurePhotosDirectory();
  const filename = `${itemId}-${Date.now()}${guessExtension(sourceUri)}`;
  const destination = new File(photosDir, filename);

  try {
    const source = new File(sourceUri);
    if (source.exists) {
      await source.copy(destination);
    } else {
      // Gallery content:// URIs may not be readable via the new File.exists check.
      await LegacyFileSystem.copyAsync({
        from: sourceUri,
        to: destination.uri,
      });
    }
  } catch {
    await LegacyFileSystem.copyAsync({
      from: sourceUri,
      to: destination.uri,
    });
  }

  if (!destination.exists) {
    throw new Error('The photo could not be saved to app storage.');
  }

  return destination.uri;
}

export async function deletePhotoFileSafely(imageUri: string | null | undefined): Promise<void> {
  if (!imageUri) {
    return;
  }

  try {
    const file = new File(imageUri);
    if (file.exists) {
      file.delete();
      return;
    }
  } catch {
    // Fall through to the legacy delete path.
  }

  try {
    const info = await LegacyFileSystem.getInfoAsync(imageUri);
    if (info.exists) {
      await LegacyFileSystem.deleteAsync(imageUri, { idempotent: true });
    }
  } catch {
    // Missing or unreadable files should not block inventory updates.
  }
}

export function isManagedItemPhoto(imageUri: string | null | undefined): boolean {
  if (!imageUri) {
    return false;
  }

  return imageUri.includes(`/${PHOTOS_DIRECTORY_NAME}/`);
}
