/**
 * Generates an offline synthetic podcast ambient soundtrack blob if network CDN is unavailable.
 * This guarantees the user has audio playing on iOS Lock Screen even in strict offline mode!
 */
export async function generateSyntheticPodcastBlob(durationSec = 60, title = 'Sample Episode'): Promise<Blob> {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  // Gentle acoustic podcast ambient sound with harmonic chords & spoken voice pitch modulation
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Ambient warm drone (chords C3, G3, E4)
    const drone =
      0.15 * Math.sin(2 * Math.PI * 130.81 * t) +
      0.12 * Math.sin(2 * Math.PI * 196.00 * t) +
      0.08 * Math.sin(2 * Math.PI * 329.63 * t);

    // Pulse rhythm resembling speech cadence
    const cadence = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.8 * t) * Math.sin(2 * Math.PI * 2.5 * t);
    const voiceFormant = 0.05 * Math.sin(2 * Math.PI * 440 * t) * cadence;

    // Fade in and out at borders
    const envelope = Math.min(1, t / 2) * Math.min(1, (durationSec - t) / 2);
    buffer[i] = (drone + voiceFormant) * envelope;
  }

  // Encode as 16-bit PCM WAV
  const wavBytes = encodeWAV(buffer, sampleRate);
  return new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
}

function encodeWAV(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}
