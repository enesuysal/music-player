import React from 'react';
import {
  Smartphone,
  Airplay,
  Share2,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sliders,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import type { Episode } from '../types/podcast';
import { formatTime, formatRemaining } from '../utils/formatters';
import { shareToNativeIOSPlayer, openNativeApplePodcasts } from '../services/mediaSession';
import { getAudioBlob } from '../services/storage';

interface Props {
  episode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
}

export const NativeIOSPlayerCard: React.FC<Props> = ({
  episode,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onSeekBackward,
  onSeekForward,
}) => {
  if (!episode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleNativeShare = async () => {
    let blob: Blob | null = null;
    if (episode.hasBlobStored) {
      blob = await getAudioBlob(episode.id);
    }
    await shareToNativeIOSPlayer(episode, blob);
  };

  return (
    <div className="mx-4 sm:mx-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c1222] border border-indigo-900/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
              <span>iOS Default Music Player Integration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Synced with Lock Screen, Dynamic Island & Control Center
            </p>
          </div>
        </div>

        <button
          onClick={handleNativeShare}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Share to Apple Music, Podcasts, or Files"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Send to iOS App</span>
        </button>
      </div>

      {/* Simulated iOS Native Lock Screen Card */}
      <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 p-3.5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <img
            src={episode.coverArtUrl || '/pwa-192x192.png'}
            alt={episode.title}
            className="w-13 h-13 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold truncate text-white">
                {episode.title}
              </h4>
              <Airplay className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {episode.showTitle}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-[9px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Native AVAudioSession Active</span>
            </div>
          </div>
        </div>

        {/* Scrubber */}
        <div className="mt-3 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
            style={{
              background: `linear-gradient(to right, #ffffff ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatRemaining(currentTime, duration)}</span>
          </div>
        </div>

        {/* Lock Screen Native Controls */}
        <div className="flex items-center justify-center gap-8 mt-1">
          <button
            onClick={onSeekBackward}
            className="text-white hover:text-indigo-300 active:scale-90 transition-all flex flex-col items-center"
            title="Rewind 15s"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[8px] font-bold">15</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onSeekForward}
            className="text-white hover:text-indigo-300 active:scale-90 transition-all flex flex-col items-center"
            title="Fast Forward 30s"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[8px] font-bold">30</span>
          </button>
        </div>
      </div>

      {/* Feature Capabilities Breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
          <Airplay className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>AirPlay & AirPods stem controls</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Control Center audio card</span>
        </div>
      </div>
    </div>
  );
};
