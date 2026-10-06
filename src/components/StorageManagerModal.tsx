import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Download,
  X,
  Folder,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { Episode, StorageStats } from '../types/podcast';
import { formatBytes } from '../utils/formatters';
import {
  requestPersistentStorage,
  deleteAudioBlob,
  saveAudioBlob,
  removeRememberedLocation,
  addRememberedLocation,
} from '../services/storage';
import { generateSyntheticPodcastBlob } from '../utils/audioFallback';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: StorageStats;
  episodes: Episode[];
  rememberedLocations: string[];
  onRefresh: () => void;
}

export const StorageManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  episodes,
  rememberedLocations,
  onRefresh,
}) => {
  const [newLoc, setNewLoc] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPersistence = async () => {
    const success = await requestPersistentStorage();
    onRefresh();
    if (success) {
      alert('Persistent storage active! iOS Safari will not purge your saved podcast episodes.');
    } else {
      alert('Persistent storage requested.');
    }
  };

  const handleToggleOffline = async (episode: Episode) => {
    setIsProcessing(episode.id);
    try {
      if (episode.hasBlobStored) {
        // Free space
        await deleteAudioBlob(episode.id);
      } else {
        // Cache offline
        const blob = await generateSyntheticPodcastBlob(episode.duration || 180, episode.title);
        await saveAudioBlob(episode.id, blob);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoc.trim()) return;
    await addRememberedLocation(newLoc.trim());
    setNewLoc('');
    onRefresh();
  };

  const handleRemoveLocation = async (loc: string) => {
    await removeRememberedLocation(loc);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Local Drive & Storage Vault</h2>
              <p className="text-xs text-slate-400">Offline files stored directly in phone memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Storage Overview Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-800/40 to-slate-900 border border-indigo-900/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Device Usage</span>
              <span className="text-sm font-bold text-indigo-300">
                {stats.offlineCount} of {stats.episodeCount} saved offline
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, (stats.offlineCount / (stats.episodeCount || 1)) * 100))}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>IndexedDB Cache: <strong>{formatBytes(stats.usedBytes)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                {stats.persisted ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    iOS Eviction Protected
                  </span>
                ) : (
                  <button
                    onClick={handleRequestPersistence}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium underline"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Protect from Eviction
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Remembered Locations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                Remembered Drive Locations
              </h3>
              <span className="text-[11px] text-slate-500">Auto-remembered paths</span>
            </div>

            <div className="space-y-2">
              {rememberedLocations.length === 0 ? (
                <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
                  Locations will appear here as you import files or folders.
                </div>
              ) : (
                rememberedLocations.map((loc) => (
                  <div
                    key={loc}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate text-slate-200 font-medium">{loc}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveLocation(loc)}
                      className="text-slate-400 hover:text-red-400 p-1"
                      title="Forget location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}

              {/* Add custom location */}
              <form onSubmit={handleAddLocation} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. /Music/Podcasts or iCloud/Podcasts"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save
                </button>
              </form>
            </div>
          </div>

          {/* Offline Episode Management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Episodes Offline Status
            </h3>

            <div className="space-y-2">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-800 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{ep.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {ep.showTitle} • {formatBytes(ep.sizeBytes || 3500000)}
                    </p>
                  </div>

                  <button
                    disabled={isProcessing === ep.id}
                    onClick={() => handleToggleOffline(ep)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      ep.hasBlobStored
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {isProcessing === ep.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : ep.hasBlobStored ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <span>Files persist in IndexedDB without reselection</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
