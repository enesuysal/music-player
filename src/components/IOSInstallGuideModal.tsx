import React from 'react';
import { Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Install on iPhone</h3>
              <p className="text-xs text-slate-400">Run as full-screen native iOS app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">Step 1: Open Safari Share Menu</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap the <span className="text-blue-400 font-medium">Share button</span> at the bottom of Safari toolbar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">Step 2: Add to Home Screen</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Scroll down in the share sheet and tap <span className="text-emerald-400 font-medium">Add to Home Screen</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">Default Music Player Ready</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Launches without browser address bars and streams to iPhone Lock Screen and Control Center.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
