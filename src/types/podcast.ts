export interface Episode {
  id: string;
  title: string;
  showTitle: string;
  duration: number; // in seconds
  currentTime: number; // last position in seconds
  isFavorite: boolean;
  isCompleted: boolean;
  dateAdded: number; // timestamp
  sizeBytes: number;
  originalFileName?: string;
  coverArtUrl?: string;
  description?: string;
  sourceType: 'local_file' | 'local_folder' | 'local_server' | 'sample';
  sourceLocation: string; // The remembered location (folder path, file name, or server URL)
  hasBlobStored: boolean; // True if binary audio file is saved in IndexedDB
  playbackRate?: number;
}

export type FilterTab = 'all' | 'favorites' | 'offline' | 'in_progress';

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  persisted: boolean;
  episodeCount: number;
  offlineCount: number;
}

export interface PlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  sleepTimerEnd: number | null; // Timestamp when audio should pause
  sleepTimerRemaining: number | null; // Seconds remaining
}
