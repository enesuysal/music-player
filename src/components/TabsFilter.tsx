import React from 'react';
import { Search, X, Heart, HardDrive, ListFilter, PlayCircle } from 'lucide-react';
import type { FilterTab } from '../types/podcast';

interface Props {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    favorites: number;
    offline: number;
    in_progress: number;
  };
}

export const TabsFilter: React.FC<Props> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const tabs: { id: FilterTab; label: string; icon: any; count: number }[] = [
    { id: 'all', label: 'All', icon: ListFilter, count: counts.all },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: counts.favorites },
    { id: 'offline', label: 'Offline Vault', icon: HardDrive, count: counts.offline },
    { id: 'in_progress', label: 'Continue', icon: PlayCircle, count: counts.in_progress },
  ];

  return (
    <div className="space-y-3 px-4 sm:px-6 max-w-2xl mx-auto w-full">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search episodes, shows, or filenames..."
          className="w-full pl-9.5 pr-8 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* iOS Segmented Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap active:scale-[0.98] ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1 rounded-full ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
