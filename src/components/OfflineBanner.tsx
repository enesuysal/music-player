import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 text-slate-950 px-4 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md animate-fade-in border border-amber-400/40">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Playing directly from Local Drive Vault</span>
    </div>
  );
};
