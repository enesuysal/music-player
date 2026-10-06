import React, { useState } from 'react';
import {
  ChevronDown,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Moon,
  Volume2,
  VolumeX,
  FileText,
  Cast,
  CheckCircle2,
  HardDrive,
  Share2,
} from 'lucide-react';
import type { Episode } from '../types/podcast';
import { formatTime, formatRemaining } from '../utils/formatters';
import { shareToNativeIOSPlayer } from '../services/mediaSession';
import { getAudioBlob } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  sleepTimerRemaining: number | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onChangeRate: (rate: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSleepTimer: () => void;
}

const AVAILABLE_RATES = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const FullPlayerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  episode,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  sleepTimerRemaining,
  onTogglePlay,
  onSeek,
  onSeekBackward,
  onSeekForward,
  onPrevious,
  onNext,
  onChangeRate,
  onChangeVolume,
  onToggleFavorite,
  onOpenSleepTimer,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  if (!isOpen || !episode) return null;

  const cycleRate = () => {
    const nextIdx = (AVAILABLE_RATES.indexOf(playbackRate) + 1) % AVAILABLE_RATES.length;
    onChangeRate(AVAILABLE_RATES[nextIdx]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090d16] text-white animate-fade-in select-none">
      {/* Top Background Ambient Glow */}
      <div
        className="absolute inset-x-0 top-0 h-96 opacity-25 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 20%, #6366f1, #4338ca 40%, transparent 80%)`,
        }}
      />

      {/* Top Bar with Safe Area and Grab Handle */}
      <div className="relative pt-[calc(var(--sat)+12px)] pb-3 px-5 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">
            Now Playing
          </span>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
            {episode.showTitle}
          </span>
        </div>

        <button
          onClick={() => onToggleFavorite(episode.id)}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
            episode.isFavorite
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${episode.isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Center Body - Scrollable if on smaller screen */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-4 overflow-y-auto max-w-md mx-auto w-full">
        {/* Cover Artwork */}
        <div className="w-full flex justify-center my-auto py-2">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-950/60 border border-slate-800 group">
            <img
              src={episode.coverArtUrl || '/pwa-512x512.png'}
              alt={episode.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {episode.hasBlobStored && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Offline Vault</span>
              </div>
            )}
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="w-full text-center mt-3 mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-white line-clamp-2 px-2 leading-snug">
            {episode.title}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1 truncate">
            {episode.showTitle}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-indigo-400" />
              {episode.sourceLocation || 'Local Driver'}
            </span>
          </div>
        </div>

        {/* Scrubber Section */}
        <div className="w-full space-y-1.5 mb-5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #6366f1 ${progressPercent}%, #1e293b ${progressPercent}%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatRemaining(currentTime, duration)}</span>
          </div>
        </div>

        {/* Main Playback Controls */}
        <div className="w-full flex items-center justify-between px-2 mb-6">
          {/* Rewind 15s */}
          <button
            onClick={onSeekBackward}
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
            title="Rewind 15 seconds"
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-[9px] font-bold -mt-0.5">15</span>
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevious}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause Big Button */}
          <button
            onClick={onTogglePlay}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-95 transition-all border border-indigo-400/40"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-white" />
            ) : (
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Forward 30s */}
          <button
            onClick={onSeekForward}
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
            title="Forward 30 seconds"
          >
            <RotateCw className="w-6 h-6" />
            <span className="text-[9px] font-bold -mt-0.5">30</span>
          </button>
        </div>

        {/* Bottom Utility Controls */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          {/* Speed Toggle */}
          <button
            onClick={cycleRate}
            className="px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 font-semibold text-white active:scale-95 transition-all"
          >
            {playbackRate}x
          </button>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all ${
              sleepTimerRemaining !== null
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{sleepTimerRemaining !== null ? formatTime(sleepTimerRemaining) : 'Timer'}</span>
          </button>

          {/* Description Drawer Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all ${
              showNotes
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>
        </div>

        {/* System Media Integration Banner */}
        <div className="w-full mt-4 p-2.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between gap-2 text-[11px] text-indigo-300">
          <div className="flex items-center gap-1.5 truncate">
            <Cast className="w-3.5 h-3.5 animate-pulse text-indigo-400 shrink-0" />
            <span className="truncate">Synced with iOS Lock Screen & Control Center</span>
          </div>
          <button
            onClick={async () => {
              let blob: Blob | null = null;
              if (episode.hasBlobStored) {
                blob = await getAudioBlob(episode.id);
              }
              await shareToNativeIOSPlayer(episode, blob);
            }}
            className="px-2 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/40 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
            title="Send audio file to Apple Music, Podcasts, or Files"
          >
            <Share2 className="w-3 h-3" />
            <span>Send to iOS App</span>
          </button>
        </div>

        {/* Collapsible Notes Sheet */}
        {showNotes && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 space-y-2 animate-fade-in">
            <h4 className="font-bold text-white text-xs">Episode Overview</h4>
            <p className="leading-relaxed whitespace-pre-line text-slate-300">
              {episode.description || 'No notes available for this episode.'}
            </p>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/60">
              Source: {episode.sourceLocation} • Size: {(episode.sizeBytes / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        )}
      </div>

      {/* Safe Area Spacer at bottom */}
      <div className="h-[calc(var(--sab)+8px)] shrink-0" />
    </div>
  );
};
