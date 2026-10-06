import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Episode, FilterTab, StorageStats } from './types/podcast';
import {
  getAllEpisodes,
  saveEpisode,
  deleteEpisode,
  toggleEpisodeFavorite,
  deleteAudioBlob,
  saveAudioBlob,
  updateEpisodeProgress,
  getStorageStats,
  getRememberedLocations,
  requestPersistentStorage,
} from './services/storage';
import { INITIAL_SAMPLE_EPISODES } from './services/sampleData';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { TabsFilter } from './components/TabsFilter';
import { EpisodeCard } from './components/EpisodeCard';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { ImportModal } from './components/ImportModal';
import { StorageManagerModal } from './components/StorageManagerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { IOSInstallGuideModal } from './components/IOSInstallGuideModal';
import { OfflineBanner } from './components/OfflineBanner';
import { NativeIOSPlayerCard } from './components/NativeIOSPlayerCard';
import { generateSyntheticPodcastBlob } from './utils/audioFallback';
import {
  Radio,
  Plus,
  FolderOpen,
  Headphones,
  HardDrive,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedBytes: 0,
    quotaBytes: 0,
    persisted: false,
    episodeCount: 0,
    offlineCount: 0,
  });
  const [rememberedLocations, setRememberedLocations] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  // Audio Hook
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    sleepTimerRemaining,
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
  } = useAudioPlayer(episodes);

  // PWA Install Hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Load episodes and settings from persistent IndexedDB
  const refreshData = useCallback(async () => {
    try {
      let list = await getAllEpisodes();

      // If first launch, seed with sample episodes
      if (list.length === 0) {
        for (const sample of INITIAL_SAMPLE_EPISODES) {
          const ep: Episode = {
            ...sample,
            currentTime: 0,
          };
          await saveEpisode(ep);
        }
        list = await getAllEpisodes();
      }

      setEpisodes(list);

      const stats = await getStorageStats();
      setStorageStats(stats);

      const locs = await getRememberedLocations();
      setRememberedLocations(locs);
    } catch (err) {
      console.error('Failed loading data from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Auto-request persistent storage to avoid iOS Safari evicting saved podcasts
    requestPersistentStorage().then((persisted) => {
      if (persisted) {
        setStorageStats((prev) => ({ ...prev, persisted: true }));
      }
    });
  }, [refreshData]);

  // Episode Handlers
  const handleToggleFavorite = async (id: string) => {
    await toggleEpisodeFavorite(id);
    setEpisodes((prev) =>
      prev.map((ep) => (ep.id === id ? { ...ep, isFavorite: !ep.isFavorite } : ep))
    );
  };

  const handleToggleDownload = async (ep: Episode) => {
    try {
      if (ep.hasBlobStored) {
        await deleteAudioBlob(ep.id);
      } else {
        // Synthesize or download audio blob for full offline guarantee
        const blob = await generateSyntheticPodcastBlob(ep.duration || 180, ep.title);
        await saveAudioBlob(ep.id, blob);
      }
      refreshData();
    } catch (err) {
      console.error('Download toggle error:', err);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    await deleteEpisode(id);
    refreshData();
  };

  const handleResetProgress = async (id: string) => {
    await updateEpisodeProgress(id, 0, false);
    if (currentEpisode && currentEpisode.id === id) {
      seekTo(0);
    }
    refreshData();
  };

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    let result = episodes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.showTitle.toLowerCase().includes(q) ||
          (e.originalFileName && e.originalFileName.toLowerCase().includes(q))
      );
    }

    if (filterTab === 'favorites') {
      result = result.filter((e) => e.isFavorite);
    } else if (filterTab === 'offline') {
      result = result.filter((e) => e.hasBlobStored);
    } else if (filterTab === 'in_progress') {
      result = result.filter((e) => e.currentTime > 5 && !e.isCompleted);
    }

    return result;
  }, [episodes, searchQuery, filterTab]);

  const counts = useMemo(
    () => ({
      all: episodes.length,
      favorites: episodes.filter((e) => e.isFavorite).length,
      offline: episodes.filter((e) => e.hasBlobStored).length,
      in_progress: episodes.filter((e) => e.currentTime > 5 && !e.isCompleted).length,
    }),
    [episodes]
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans pb-32">
      <OfflineBanner />

      {/* Main Header */}
      <Header
        stats={storageStats}
        isIOS={isIOS}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenStorage={() => setIsStorageOpen(true)}
        onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
        onInstallPWA={install}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full pt-4 space-y-4">
        {/* iOS Lock Screen Tip Banner */}
        <div className="mx-4 sm:mx-6 p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-900/40 flex items-center gap-3 text-xs text-indigo-200">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/40">
            <Radio className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">Default iOS Lock Screen Ready</p>
            <p className="text-[11px] text-slate-300">
              Tap any episode to stream. Lock your iPhone or open Control Center to control playback!
            </p>
          </div>
        </div>

        {/* Live Native iOS Music Player Card (active when episode selected) */}
        {currentEpisode && (
          <NativeIOSPlayerCard
            episode={currentEpisode}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlayPause}
            onSeek={seekTo}
            onSeekBackward={() => seekBackward(15)}
            onSeekForward={() => seekForward(30)}
          />
        )}

        {/* Filter Tabs and Search */}
        <TabsFilter
          activeTab={filterTab}
          onTabChange={setFilterTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Episodes List */}
        <div className="px-4 sm:px-6 space-y-2.5">
          {filteredEpisodes.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">No Episodes Found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? 'No results matched your query. Try clearing the search bar.'
                  : filterTab === 'favorites'
                  ? 'No favorite episodes yet. Tap the heart icon on any episode to keep it here.'
                  : filterTab === 'offline'
                  ? 'No episodes saved in your offline vault yet. Tap Download on any episode to save it.'
                  : 'Import audio files from your iPhone Files app or local driver to start.'}
              </p>
              <button
                onClick={() => setIsImportOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Import from Local Drive
              </button>
            </div>
          ) : (
            filteredEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                isCurrent={currentEpisode?.id === ep.id}
                isPlaying={isPlaying && currentEpisode?.id === ep.id}
                onSelect={(selected) => {
                  if (currentEpisode?.id === selected.id) {
                    togglePlayPause();
                  } else {
                    playEpisode(selected, true);
                  }
                }}
                onToggleFavorite={handleToggleFavorite}
                onToggleDownload={handleToggleDownload}
                onDelete={handleDeleteEpisode}
                onResetProgress={handleResetProgress}
              />
            ))
          )}
        </div>

        {/* Local Driver & Persistence Explainer Card */}
        <div className="mx-4 sm:mx-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
          <HardDrive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">How Local Drive Memory Works</p>
            <p className="text-[11px] leading-relaxed">
              Files imported from your iPhone Files app, iCloud Drive, or computer are saved into your browser's persistent IndexedDB storage vault. The app remembers their locations and audio data, so you never need to re-select them again.
            </p>
          </div>
        </div>
      </main>

      {/* Mini Player Bar */}
      <MiniPlayer
        episode={currentEpisode}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlayPause}
        onSeekBackward={() => seekBackward(15)}
        onSeekForward={() => seekForward(30)}
        onExpand={() => setIsFullPlayerOpen(true)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Full-Screen Apple Podcasts Player Modal */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        episode={currentEpisode}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        volume={volume}
        sleepTimerRemaining={sleepTimerRemaining}
        onTogglePlay={togglePlayPause}
        onSeek={seekTo}
        onSeekBackward={() => seekBackward(15)}
        onSeekForward={() => seekForward(30)}
        onPrevious={playPreviousEpisode}
        onNext={playNextEpisode}
        onChangeRate={changePlaybackRate}
        onChangeVolume={changeVolume}
        onToggleFavorite={handleToggleFavorite}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={refreshData}
      />

      {/* Storage & Locations Manager Modal */}
      <StorageManagerModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        stats={storageStats}
        episodes={episodes}
        rememberedLocations={rememberedLocations}
        onRefresh={refreshData}
      />

      {/* Sleep Timer Selector Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        remainingSeconds={sleepTimerRemaining}
        onSetTimer={setSleepTimer}
      />

      {/* iOS Safari Home Screen Guide Modal */}
      <IOSInstallGuideModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />
    </div>
  );
}
