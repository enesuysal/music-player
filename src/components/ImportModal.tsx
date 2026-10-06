import React, { useState, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  Globe,
  HardDrive,
  CheckCircle2,
  X,
  FileAudio,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { Episode } from '../types/podcast';
import { saveEpisode, addRememberedLocation } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'folder' | 'server'>('files');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);

  // Server URL inputs
  const [serverUrl, setServerUrl] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [showTitle, setShowTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>, isFolder = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setImportStatus(`Reading ${files.length} file(s)...`);

    try {
      let count = 0;
      let rememberedPath = isFolder ? 'Local Folder / Podcasts' : 'Local Drive / Music';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|aac|wav|ogg|flac|m4b)$/i)) {
          continue;
        }

        // Detect path if available
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            rememberedPath = parts.slice(0, -1).join('/');
          }
        }

        setImportStatus(`Importing "${file.name}" into persistent storage...`);

        // Clean title
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const id = 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        // Estimate or read duration
        let duration = 300; // default 5m estimate
        try {
          const tempAudio = new Audio();
          const objectUrl = URL.createObjectURL(file);
          tempAudio.src = objectUrl;
          await new Promise((resolve) => {
            tempAudio.onloadedmetadata = () => {
              duration = Math.floor(tempAudio.duration) || 300;
              URL.revokeObjectURL(objectUrl);
              resolve(true);
            };
            tempAudio.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(false);
            };
            setTimeout(resolve, 1500); // safety timeout
          });
        } catch {
          // fallback duration
        }

        const newEpisode: Episode = {
          id,
          title: cleanName,
          showTitle: isFolder ? rememberedPath.split('/').pop() || 'Local Vault' : 'Imported Audio',
          duration,
          currentTime: 0,
          isFavorite: false,
          isCompleted: false,
          dateAdded: Date.now(),
          sizeBytes: file.size,
          originalFileName: file.name,
          coverArtUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80',
          description: `Imported from local drive: ${file.name}. Stored permanently in local device memory.`,
          sourceType: isFolder ? 'local_folder' : 'local_file',
          sourceLocation: rememberedPath,
          hasBlobStored: true,
          playbackRate: 1.0,
        };

        // Persist file into IndexedDB
        await saveEpisode(newEpisode, file);
        count++;
      }

      await addRememberedLocation(rememberedPath);
      setImportedCount(count);
      setImportStatus(`Successfully saved ${count} episode(s) into persistent local storage!`);
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setImportStatus('Error importing files: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleServerUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim()) return;

    setIsProcessing(true);
    setImportStatus('Verifying audio source...');

    try {
      const id = 'ep_url_' + Date.now();
      const title = episodeTitle.trim() || 'Remote Podcast Stream';
      const show = showTitle.trim() || 'Local Network Drive';

      // Download audio blob for full offline guarantee if possible
      let blob: Blob | undefined;
      setImportStatus('Downloading audio stream to local device cache...');
      try {
        const resp = await fetch(serverUrl.trim());
        if (resp.ok) {
          blob = await resp.blob();
        }
      } catch {
        // Fallback: store as direct stream if CORS prevents fetch
      }

      const newEp: Episode = {
        id,
        title,
        showTitle: show,
        duration: 600,
        currentTime: 0,
        isFavorite: false,
        isCompleted: false,
        dateAdded: Date.now(),
        sizeBytes: blob ? blob.size : 5000000,
        coverArtUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        description: `Streamed or cached from ${serverUrl}`,
        sourceType: 'local_server',
        sourceLocation: serverUrl.trim(),
        hasBlobStored: !!blob,
        playbackRate: 1.0,
      };

      await saveEpisode(newEp, blob);
      await addRememberedLocation(serverUrl.trim());

      setImportStatus('Episode saved to local vault!');
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1000);
    } catch (err: any) {
      setImportStatus('Failed to add URL: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Import from Local Drive</h2>
              <p className="text-xs text-slate-400">Files are permanently saved so you never reselect</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'files'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            Select Files
          </button>
          <button
            onClick={() => setActiveTab('folder')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'folder'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Select Entire Folder
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'server'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Local Network URL
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-indigo-950/20 hover:bg-indigo-950/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <HardDrive className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-white text-base">Choose Audio Files from iPhone</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Select MP3, M4A, AAC, or WAV files from your iOS Files app, iCloud Drive, or computer.
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30">
                  Browse Files
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.m4b"
                className="hidden"
                onChange={(e) => handleFilesChosen(e, false)}
              />

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Persistent Device Memory:</strong> Files are stored directly inside your browser's persistent IndexedDB storage. You only need to pick them once — they will always remain available for playback and offline listening!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'folder' && (
            <div className="space-y-4">
              <div
                onClick={() => folderInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-indigo-950/20 hover:bg-indigo-950/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-white text-base">Select Entire Podcast Folder</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Import an entire directory of episodes from your local driver. The app remembers the folder location.
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30">
                  Select Folder
                </span>
              </div>

              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error directory attribute
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={(e) => handleFilesChosen(e, true)}
              />

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Folder Memory:</strong> The app records the folder path in settings and persists every track in offline storage.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'server' && (
            <form onSubmit={handleServerUrlSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Local Server / Drive Stream URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="http://192.168.1.50:8080/podcasts/episode-1.mp3"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  Enter your local network host, NAS, or public audio link.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Episode Title</label>
                  <input
                    type="text"
                    placeholder="My Custom Episode"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Podcast / Show Name</label>
                  <input
                    type="text"
                    placeholder="Home Server Podcast"
                    value={showTitle}
                    onChange={(e) => setShowTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                Add & Remember Location
              </button>
            </form>
          )}

          {/* Status feedback */}
          {importStatus && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-200 flex items-center gap-2">
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />}
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
