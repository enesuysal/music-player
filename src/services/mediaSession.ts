import type { Episode } from '../types/podcast';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onSeekBackward: (offset?: number) => void;
  onSeekForward: (offset?: number) => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeekTo: (details: MediaSessionActionDetails) => void;
  onStop?: () => void;
}

/**
 * Sync audio player state with native iOS System Music Player (Lock Screen, Control Center, Dynamic Island, Apple Watch, AirPods)
 */
export function setupMediaSession(episode: Episode, callbacks: MediaSessionCallbacks) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  const artSrc = episode.coverArtUrl || '/pwa-512x512.png';

  // Multi-resolution artwork for iOS Retina displays and Apple Watch
  const artworkList: MediaImage[] = [
    { src: artSrc, sizes: '96x96', type: 'image/png' },
    { src: artSrc, sizes: '128x128', type: 'image/png' },
    { src: artSrc, sizes: '192x192', type: 'image/png' },
    { src: artSrc, sizes: '256x256', type: 'image/png' },
    { src: artSrc, sizes: '384x384', type: 'image/png' },
    { src: artSrc, sizes: '512x512', type: 'image/png' },
  ];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: episode.title,
    artist: episode.showTitle || 'PodVault Podcast',
    album: episode.showTitle || 'PodVault iOS Library',
    artwork: artworkList,
  });

  // Action handlers connecting native iOS player controls back into the app
  try {
    navigator.mediaSession.setActionHandler('play', () => callbacks.onPlay());
    navigator.mediaSession.setActionHandler('pause', () => callbacks.onPause());

    // Native iOS 15s rewind / 30s forward buttons
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      callbacks.onSeekBackward(details.seekOffset || 15);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      callbacks.onSeekForward(details.seekOffset || 30);
    });

    if (callbacks.onPreviousTrack) {
      navigator.mediaSession.setActionHandler('previoustrack', () => callbacks.onPreviousTrack!());
    }
    if (callbacks.onNextTrack) {
      navigator.mediaSession.setActionHandler('nexttrack', () => callbacks.onNextTrack!());
    }

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      callbacks.onSeekTo(details);
    });

    if (callbacks.onStop) {
      navigator.mediaSession.setActionHandler('stop', () => callbacks.onStop!());
    }
  } catch (err) {
    console.warn('Error configuring native MediaSession action handlers:', err);
  }
}

export function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function updateMediaSessionPosition(position: number, duration: number, playbackRate = 1.0) {
  if (
    typeof window === 'undefined' ||
    !('mediaSession' in navigator) ||
    !navigator.mediaSession.setPositionState ||
    !duration ||
    isNaN(duration) ||
    duration <= 0
  ) {
    return;
  }

  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate: playbackRate,
      position: Math.min(Math.max(0, position), duration),
    });
  } catch {
    // Suppress if out of bounds
  }
}

/**
 * Exports or shares the episode audio directly into the native iOS system apps
 * (Apple Music, Apple Podcasts, iOS Files, AirDrop, etc.)
 */
export async function shareToNativeIOSPlayer(episode: Episode, blob?: Blob | null): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    if (blob) {
      const fileName = episode.originalFileName || `${episode.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      const file = new File([blob], fileName, { type: blob.type || 'audio/mpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: episode.title,
          text: `Podcast: ${episode.showTitle}`,
        });
        return true;
      }
    }

    // Fallback: share title & source
    await navigator.share({
      title: episode.title,
      text: `${episode.title} - ${episode.showTitle}`,
      url: window.location.href,
    });
    return true;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('Native share failed:', err);
    }
    return false;
  }
}

/**
 * Attempts to launch native iOS Podcasts app or native Apple Music
 */
export function openNativeApplePodcasts() {
  if (typeof window !== 'undefined') {
    window.location.href = 'podcasts://';
  }
}

export function openNativeAppleMusic() {
  if (typeof window !== 'undefined') {
    window.location.href = 'music://';
  }
}
