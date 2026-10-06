import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Heart } from 'lucide-react';
import type { Episode } from '../types/podcast';

interface Props {
  episode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onExpand: () => void;
  onToggleFavorite: (id: string) => void;
}

export const MiniPlayer: React.FC<Props> = ({
  episode,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeekBackward,
  onSeekForward,
  onExpand,
  onToggleFavorite,
}) => {
  if (!episode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[calc(var(--sab)+12px)] inset-x-3 sm:inset-x-6 max-w-xl mx-auto z-40">
      <div
        onClick={onExpand}
        className="relative overflow-hidden cursor-pointer rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-black/80 flex items-center justify-between p-2.5 pl-3 gap-3 active:scale-[0.99] transition-all group"
      >
        {/* Left: Thumbnail & Episode Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow-md">
            <img
              src={episode.coverArtUrl || '/pwa-192x192.png'}
              alt={episode.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {episode.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {episode.showTitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Favorite heart */}
          <button
            onClick={() => onToggleFavorite(episode.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 active:scale-90 transition-all"
          >
            <Heart className={`w-4 h-4 ${episode.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* 15s back */}
          <button
            onClick={onSeekBackward}
            className="w-8 h-8 rounded-full flex flex-col items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
            title="Rewind 15s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-90 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Scrubber indicator line at bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
