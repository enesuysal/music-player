import { openDB, type IDBPDatabase } from 'idb';
import type { Episode, StorageStats } from '../types/podcast';

const DB_NAME = 'podvault_database';
const DB_VERSION = 1;

interface PodVaultDB {
  episodes: {
    key: string;
    value: Episode;
    indexes: { 'by-date': number; 'by-show': string };
  };
  audio_blobs: {
    key: string;
    value: { id: string; blob: Blob; mimeType: string };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('episodes')) {
          const epStore = db.createObjectStore('episodes', { keyPath: 'id' });
          epStore.createIndex('by-date', 'dateAdded');
          epStore.createIndex('by-show', 'showTitle');
        }
        if (!db.objectStoreNames.contains('audio_blobs')) {
          db.createObjectStore('audio_blobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Requests persistent storage from the browser (crucial on iOS Safari to prevent eviction).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      return await navigator.storage.persist();
    } catch (e) {
      console.warn('Storage persist request failed:', e);
      return false;
    }
  }
  return false;
}

export async function checkStoragePersisted(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Get all stored episodes
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  const db = await getDB();
  const list = await db.getAll('episodes');
  return list.sort((a, b) => b.dateAdded - a.dateAdded);
}

/**
 * Save or update episode metadata and optionally its audio blob
 */
export async function saveEpisode(episode: Episode, blob?: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['episodes', 'audio_blobs'], 'readwrite');
  
  if (blob) {
    await tx.objectStore('audio_blobs').put({
      id: episode.id,
      blob,
      mimeType: blob.type || 'audio/mpeg',
    });
    episode.hasBlobStored = true;
    episode.sizeBytes = blob.size;
  }
  
  await tx.objectStore('episodes').put(episode);
  await tx.done;
}

/**
 * Save audio blob for an existing episode (for offline downloading)
 */
export async function saveAudioBlob(episodeId: string, blob: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['episodes', 'audio_blobs'], 'readwrite');
  
  await tx.objectStore('audio_blobs').put({
    id: episodeId,
    blob,
    mimeType: blob.type || 'audio/mpeg',
  });
  
  const ep = await tx.objectStore('episodes').get(episodeId);
  if (ep) {
    ep.hasBlobStored = true;
    ep.sizeBytes = blob.size;
    await tx.objectStore('episodes').put(ep);
  }
  
  await tx.done;
}

/**
 * Retrieve audio Blob from IndexedDB
 */
export async function getAudioBlob(episodeId: string): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get('audio_blobs', episodeId);
  return record ? record.blob : null;
}

/**
 * Remove audio blob to free storage space, but keep episode metadata
 */
export async function deleteAudioBlob(episodeId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['episodes', 'audio_blobs'], 'readwrite');
  await tx.objectStore('audio_blobs').delete(episodeId);
  const ep = await tx.objectStore('episodes').get(episodeId);
  if (ep) {
    ep.hasBlobStored = false;
    await tx.objectStore('episodes').put(ep);
  }
  await tx.done;
}

/**
 * Delete episode completely (metadata and blob)
 */
export async function deleteEpisode(episodeId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['episodes', 'audio_blobs'], 'readwrite');
  await tx.objectStore('episodes').delete(episodeId);
  await tx.objectStore('audio_blobs').delete(episodeId);
  await tx.done;
}

/**
 * Update episode playback progress
 */
export async function updateEpisodeProgress(episodeId: string, currentTime: number, isCompleted: boolean): Promise<void> {
  const db = await getDB();
  const ep = await db.get('episodes', episodeId);
  if (ep) {
    ep.currentTime = currentTime;
    ep.isCompleted = isCompleted;
    await db.put('episodes', ep);
  }
}

/**
 * Toggle favorite status
 */
export async function toggleEpisodeFavorite(episodeId: string): Promise<boolean> {
  const db = await getDB();
  const ep = await db.get('episodes', episodeId);
  if (ep) {
    ep.isFavorite = !ep.isFavorite;
    await db.put('episodes', ep);
    return ep.isFavorite;
  }
  return false;
}

/**
 * Remembered locations list (e.g., local folders, file paths, local drive network URLs)
 */
export async function getRememberedLocations(): Promise<string[]> {
  const db = await getDB();
  const locations = await db.get('settings', 'remembered_locations');
  return locations || [];
}

export async function addRememberedLocation(location: string): Promise<string[]> {
  const db = await getDB();
  const current: string[] = (await db.get('settings', 'remembered_locations')) || [];
  if (!current.includes(location)) {
    current.push(location);
    await db.put('settings', current, 'remembered_locations');
  }
  return current;
}

export async function removeRememberedLocation(location: string): Promise<string[]> {
  const db = await getDB();
  let current: string[] = (await db.get('settings', 'remembered_locations')) || [];
  current = current.filter(l => l !== location);
  await db.put('settings', current, 'remembered_locations');
  return current;
}

/**
 * Compute overall storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  let usedBytes = 0;
  let quotaBytes = 0;
  const persisted = await checkStoragePersisted();
  
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      // fallback
    }
  }

  const episodes = await getAllEpisodes();
  const offlineCount = episodes.filter(e => e.hasBlobStored).length;

  return {
    usedBytes,
    quotaBytes,
    persisted,
    episodeCount: episodes.length,
    offlineCount,
  };
}
