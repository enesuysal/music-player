import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  HardDrive,
  Download,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import type { Episode } from '../types/podcast';
import { formatTime, formatBytes, formatDate } from '../utils/formatters';

interface Props {
  episode: Episode;
  isCurrent: boolean;
  isPlaying: boolean;
  onSelect: (ep: Episode) => void;
  onToggleFavorite: (id: string) => void;
  onToggleDownload: (ep: Episode) => void;
  onDelete: (id: string) => void;
  onResetProgress: (id: string) => void;
}

export const EpisodeCard: React.FC<Props> = ({
  episode,
  isCurrent,
  isPlaying,
  onSelect,
  onToggleFavorite,
  onToggleDownload,
  onDelete,
  onResetProgress,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const progressPercent =
    episode.duration > 0 && episode.currentTime > 0
      ? Math.min(100, (episode.currentTime / episode.duration) * 100)
      : 0;

  return (
    <div
      onClick={() => onSelect(episode)}
      className={`group relative overflow-hidden rounded-2xl p-3.5 transition-all cursor-pointer border select-none ${
        isCurrent
          ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
          : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Cover Artwork with Play/Pause button */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow-md">
          <img
            src={episode.coverArtUrl || '/pwa-192x192.png'}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              isCurrent ? 'bg-black/40 opacity-100' : 'bg-black/30 opacity-0 group-hover:opacity-100'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Progress bar overlay on image bottom */}
          {progressPercent > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
              <div
                className="h-full bg-indigo-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Episode Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 mb-0.5">
            <span className="truncate">{episode.showTitle}</span>
            <span>•</span>
            <span className="text-slate-400 font-normal shrink-0">{formatDate(episode.dateAdded)}</span>
          </div>

          <h3
            className={`text-sm font-bold line-clamp-2 leading-snug transition-colors ${
              isCurrent ? 'text-indigo-200' : 'text-white group-hover:text-indigo-200'
            }`}
          >
            {episode.title}
          </h3>

          {/* Badges / Status row */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatTime(episode.duration)}
            </span>

            {episode.currentTime > 5 && !episode.isCompleted && (
              <span className="text-indigo-300 font-medium">
                Resumes at {formatTime(episode.currentTime)}
              </span>
            )}

            {episode.isCompleted && (
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Finished
              </span>
            )}

            {/* Offline Storage Status */}
            {episode.hasBlobStored ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5" />
                Offline Vault ({formatBytes(episode.sizeBytes)})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                Network Stream
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex flex-col items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(episode.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 active:scale-90 transition-all"
            title={episode.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                episode.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Context Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-48 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 text-xs text-slate-200 animate-fade-in space-y-1">
                  <button
                    onClick={() => {
                      onToggleDownload(episode);
                      setShowMenu(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 text-left"
                  >
                    {episode.hasBlobStored ? (
                      <>
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Free Stored Space</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Download for Offline</span>
                      </>
                    )}
                  </button>

                  {episode.currentTime > 0 && (
                    <button
                      onClick={() => {
                        onResetProgress(episode.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-700 text-left"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Start from Beginning</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDelete(episode.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 hover:bg-red-500/20 text-red-300 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete from Vault</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
