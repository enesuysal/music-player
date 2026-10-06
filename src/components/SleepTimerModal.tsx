import React from 'react';
import { Moon, X, Clock, Check } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number | null;
  onSetTimer: (minutes: number | 'end_of_episode' | null) => void;
}

export const SleepTimerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  remainingSeconds,
  onSetTimer,
}) => {
  if (!isOpen) return null;

  const timerOptions: { label: string; value: number | 'end_of_episode' }[] = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
    { label: 'End of current episode', value: 'end_of_episode' },
  ];

  const handleSelect = (val: number | 'end_of_episode') => {
    onSetTimer(val);
    onClose();
  };

  const handleCancel = () => {
    onSetTimer(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Sleep Timer</h3>
              {remainingSeconds !== null ? (
                <p className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pauses in {formatTime(remainingSeconds)}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Automatically stop playback</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          {timerOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.value)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-between transition-all"
            >
              <span>{opt.label}</span>
              <span className="text-purple-400 text-[10px]">Select</span>
            </button>
          ))}
        </div>

        {remainingSeconds !== null && (
          <button
            onClick={handleCancel}
            className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-semibold"
          >
            Turn Off Timer
          </button>
        )}
      </div>
    </div>
  );
};
