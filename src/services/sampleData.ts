import type { Episode } from '../types/podcast';

export const INITIAL_SAMPLE_EPISODES: Omit<Episode, 'currentTime'>[] = [
  {
    id: 'sample-ep-1',
    title: 'Episode 42: Deep Work & Mindful Focus',
    showTitle: 'The Modern Thinker',
    duration: 184, // ~3 mins demo
    isFavorite: true,
    isCompleted: false,
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 2,
    sizeBytes: 3840000,
    originalFileName: 'modern-thinker-ep42.mp3',
    coverArtUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
    description: 'An insightful exploration of how uninterrupted deep focus rewires the human brain and fosters creative breakthroughs in an age of constant notification overload.',
    sourceType: 'sample',
    sourceLocation: 'Local Library / Curated Essentials',
    hasBlobStored: false,
    // High reliability royalty-free audio demo
    playbackRate: 1.0,
  },
  {
    id: 'sample-ep-2',
    title: 'Architectures of Tomorrow: Spatial Computing & iOS',
    showTitle: 'Tech Horizon Daily',
    duration: 215,
    isFavorite: false,
    isCompleted: false,
    dateAdded: Date.now() - 1000 * 60 * 60 * 12,
    sizeBytes: 4280000,
    originalFileName: 'tech-horizon-spatial-computing.mp3',
    coverArtUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
    description: 'A deep dive into mobile hardware evolution, audio signal processing, offline-first mobile web apps, and system lock screen controls.',
    sourceType: 'sample',
    sourceLocation: 'Local Drive / Tech Horizon Vault',
    hasBlobStored: false,
    playbackRate: 1.0,
  },
  {
    id: 'sample-ep-3',
    title: 'The Sound of Silence: Ambient Acoustic Design',
    showTitle: 'Sonic Architecture',
    duration: 156,
    isFavorite: true,
    isCompleted: false,
    dateAdded: Date.now() - 1000 * 60 * 60 * 48,
    sizeBytes: 3120000,
    originalFileName: 'sonic-architecture-silence.mp3',
    coverArtUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    description: 'How acoustic engineers design concert halls, recording studios, and noise-cancelling headphones to sculpt spatial perception.',
    sourceType: 'sample',
    sourceLocation: 'Local Drive / High-Fidelity Audio',
    hasBlobStored: false,
    playbackRate: 1.0,
  },
];

// Reliable royalty-free audio sources for sample streams
export const SAMPLE_AUDIO_URLS: Record<string, string> = {
  'sample-ep-1': 'https://cdn.freesound.org/previews/612/612087_5674468-lq.mp3',
  'sample-ep-2': 'https://cdn.freesound.org/previews/568/568434_11861866-lq.mp3',
  'sample-ep-3': 'https://cdn.freesound.org/previews/618/618037_5674468-lq.mp3',
};
