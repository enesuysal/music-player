import { useState, useRef, useEffect, useCallback } from 'react';
import type { Episode } from '../types/podcast';
import { getAudioBlob, updateEpisodeProgress, saveAudioBlob } from '../services/storage';
import {
  setupMediaSession,
  updateMediaSessionPlaybackState,
  updateMediaSessionPosition,
} from '../services/mediaSession';
import { SAMPLE_AUDIO_URLS } from '../services/sampleData';
import { generateSyntheticPodcastBlob } from '../utils/audioFallback';

export function useAudioPlayer(
  episodes: Episode[],
  onEpisodeUpdated?: (updated: Episode) => void
) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const lastSavedPosRef = useRef<number>(0);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    // Essential for iOS mobile playback
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      updateMediaSessionPlaybackState(true);
    };

    const onPause = () => {
      setIsPlaying(false);
      updateMediaSessionPlaybackState(false);
    };

    const onTimeUpdate = () => {
      if (!audio) return;
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Periodically update MediaSession position for iOS Control Center
      if (audio.duration && !isNaN(audio.duration)) {
        updateMediaSessionPosition(cur, audio.duration, audio.playbackRate);
      }

      // Save position to IndexedDB every 5 seconds
      if (Math.abs(cur - lastSavedPosRef.current) > 5 && currentEpisode) {
        lastSavedPosRef.current = cur;
        const isCompleted = audio.duration ? cur >= audio.duration - 5 : false;
        updateEpisodeProgress(currentEpisode.id, cur, isCompleted);
      }
    };

    const onLoadedMetadata = () => {
      if (!audio) return;
      const dur = audio.duration || 0;
      setDuration(dur);
      setIsBuffering(false);

      // Resume from stored position if available
      if (currentEpisode && currentEpisode.currentTime > 0 && currentEpisode.currentTime < dur - 5) {
        audio.currentTime = currentEpisode.currentTime;
      }
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);

    const onEnded = () => {
      setIsPlaying(false);
      updateMediaSessionPlaybackState(false);
      if (currentEpisode) {
        updateEpisodeProgress(currentEpisode.id, audio.duration || 0, true);
      }
      // Auto play next episode if available
      playNextEpisode();
    };

    const onError = async (e: Event) => {
      console.warn('Audio playback error encountered:', e);
      setIsBuffering(false);
      // If network playback of a sample failed, fallback to synthetic audio blob
      if (currentEpisode && currentEpisode.sourceType === 'sample' && !currentEpisode.hasBlobStored) {
        try {
          setErrorMsg('Generating offline audio stream...');
          const fallbackBlob = await generateSyntheticPodcastBlob(currentEpisode.duration || 180, currentEpisode.title);
          await saveAudioBlob(currentEpisode.id, fallbackBlob);
          const newUrl = URL.createObjectURL(fallbackBlob);
          if (activeBlobUrlRef.current) URL.revokeObjectURL(activeBlobUrlRef.current);
          activeBlobUrlRef.current = newUrl;
          audio.src = newUrl;
          await audio.play();
          setErrorMsg(null);
        } catch {
          setErrorMsg('Unable to play audio. Please re-import the file.');
        }
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Sleep timer ticker
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Pause audio smoothly
          if (audioRef.current) {
            audioRef.current.pause();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // Load and play an episode
  const playEpisode = useCallback(
    async (episode: Episode, startPlaying = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      setErrorMsg(null);
      setCurrentEpisode(episode);
      lastSavedPosRef.current = episode.currentTime || 0;

      // Clean up previous blob URL
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      let audioSource = '';

      // 1. Check if stored in IndexedDB as a Blob
      if (episode.hasBlobStored) {
        try {
          const blob = await getAudioBlob(episode.id);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrlRef.current = blobUrl;
            audioSource = blobUrl;
          }
        } catch (err) {
          console.warn('Error reading Blob from IndexedDB:', err);
        }
      }

      // 2. If no blob found and it's a sample, use sample URL
      if (!audioSource && episode.sourceType === 'sample') {
        audioSource = SAMPLE_AUDIO_URLS[episode.id] || '';
      }

      // 3. Fallback to synthetic offline audio if needed
      if (!audioSource) {
        try {
          const fallbackBlob = await generateSyntheticPodcastBlob(episode.duration || 120, episode.title);
          await saveAudioBlob(episode.id, fallbackBlob);
          const blobUrl = URL.createObjectURL(fallbackBlob);
          activeBlobUrlRef.current = blobUrl;
          audioSource = blobUrl;
        } catch (e) {
          setErrorMsg('Audio source not found.');
          return;
        }
      }

      audio.src = audioSource;
      audio.playbackRate = playbackRate;
      audio.load();

      // Configure iOS MediaSession (Lock Screen / Control Center)
      setupMediaSession(episode, {
        onPlay: () => {
          audioRef.current?.play().catch(console.warn);
        },
        onPause: () => {
          audioRef.current?.pause();
        },
        onSeekBackward: (offset = 15) => {
          seekBackward(offset);
        },
        onSeekForward: (offset = 30) => {
          seekForward(offset);
        },
        onPreviousTrack: () => {
          playPreviousEpisode();
        },
        onNextTrack: () => {
          playNextEpisode();
        },
        onSeekTo: (details) => {
          if (details.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = details.seekTime;
          }
        },
        onStop: () => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        },
      });

      if (startPlaying) {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            updateMediaSessionPlaybackState(true);
          }
        } catch (err) {
          console.warn('Autoplay prevented or interrupted by iOS:', err);
        }
      }
    },
    [playbackRate, episodes]
  );

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentEpisode && episodes.length > 0) {
      await playEpisode(episodes[0]);
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Play failed:', err);
      }
    }
  }, [isPlaying, currentEpisode, episodes, playEpisode]);

  const seekTo = useCallback((timeSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(timeSec, audio.duration || duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
    if (currentEpisode) {
      updateEpisodeProgress(currentEpisode.id, clamped, false);
    }
  }, [duration, currentEpisode]);

  const seekBackward = useCallback((seconds = 15) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime - seconds);
  }, [seekTo]);

  const seekForward = useCallback((seconds = 30) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + seconds);
  }, [seekTo]);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (audioRef.current && audioRef.current.duration) {
      updateMediaSessionPosition(audioRef.current.currentTime, audioRef.current.duration, rate);
    }
  }, []);

  const changeVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const playNextEpisode = useCallback(() => {
    if (!currentEpisode || episodes.length === 0) return;
    const idx = episodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx !== -1 && idx < episodes.length - 1) {
      playEpisode(episodes[idx + 1]);
    } else if (episodes.length > 0) {
      // Loop to beginning of playlist
      playEpisode(episodes[0]);
    }
  }, [currentEpisode, episodes, playEpisode]);

  const playPreviousEpisode = useCallback(() => {
    if (!currentEpisode || episodes.length === 0) return;
    // If more than 3 seconds in, restart track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seekTo(0);
      return;
    }
    const idx = episodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx > 0) {
      playEpisode(episodes[idx - 1]);
    }
  }, [currentEpisode, episodes, playEpisode, seekTo]);

  const setSleepTimer = useCallback((minutes: number | 'end_of_episode' | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
      return;
    }
    if (minutes === 'end_of_episode') {
      const remainingSec = Math.max(0, Math.floor(duration - currentTime));
      setSleepTimerRemaining(remainingSec);
      return;
    }
    setSleepTimerRemaining(minutes * 60);
  }, [duration, currentTime]);

  return {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isBuffering,
    sleepTimerRemaining,
    errorMsg,
    playEpisode,
    togglePlayPause,
    seekTo,
    seekBackward,
    seekForward,
    changePlaybackRate,
    changeVolume,
    playNextEpisode,
    playPreviousEpisode,
    setSleepTimer,
  };
}
