import React from 'react';
import {
  Radio,
  HardDrive,
  Plus,
  Share,
  Download,
  Smartphone,
} from 'lucide-react';
import type { StorageStats } from '../types/podcast';
import { formatBytes } from '../utils/formatters';

interface Props {
  stats: StorageStats;
  isIOS: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  onOpenImport: () => void;
  onOpenStorage: () => void;
  onOpenIOSGuide: () => void;
  onInstallPWA: () => void;
}

export const Header: React.FC<Props> = ({
  stats,
  isIOS,
  isInstallable,
  isInstalled,
  onOpenImport,
  onOpenStorage,
  onOpenIOSGuide,
  onInstallPWA,
}) => {
  return (
    <header className="sticky top-0 z-30 pt-[calc(var(--sat)+12px)] pb-3 px-4 sm:px-6 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>PodVault</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                iOS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 -mt-0.5">
              Default Player & Offline Vault
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Storage stats button */}
          <button
            onClick={onOpenStorage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all active:scale-95"
            title="Manage storage and drive locations"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{formatBytes(stats.usedBytes)}</span>
            <span className="sm:hidden">{stats.offlineCount} saved</span>
          </button>

          {/* iOS Install Prompt / Install App button */}
          {!isInstalled && (
            <>
              {isIOS ? (
                <button
                  onClick={onOpenIOSGuide}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Install to iPhone Home Screen"
                >
                  <Share className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add to iPhone</span>
                </button>
              ) : isInstallable ? (
                <button
                  onClick={onInstallPWA}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>
              ) : (
                <button
                  onClick={onOpenIOSGuide}
                  className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white"
                  title="iOS PWA Instructions"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Import New Episode */}
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </header>
  );
};
