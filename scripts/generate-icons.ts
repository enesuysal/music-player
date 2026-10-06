import fs from 'fs';
import zlib from 'zlib';

function createPNG(width: number, height: number, bgColor: [number, number, number], iconColor: [number, number, number]): Buffer {
  // Simple uncompressed or deflate PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // truecolor (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // Raw image data with 1 byte filter prefix per scanline
  const raw = Buffer.alloc(height * (1 + width * 3));
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw.writeUInt8(0, offset++); // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw background gradient (indigo-purple)
      const gradT = (y / height);
      let r = Math.round(bgColor[0] * (1 - gradT * 0.3));
      let g = Math.round(bgColor[1] * (1 - gradT * 0.2));
      let b = Math.round(bgColor[2] * (1 + gradT * 0.1));

      // Draw central podcast icon shape (circle + antenna/waveform)
      // Mic head: rect/rounded rect at center
      const inMicBody = (Math.abs(dx) < width * 0.12 && Math.abs(dy + height * 0.05) < height * 0.16);
      const inMicRing = (dist > width * 0.22 && dist < width * 0.26 && dy > -height * 0.05 && dy < height * 0.2);
      const inMicBase = (Math.abs(dx) < width * 0.04 && dy >= height * 0.2 && dy < height * 0.28) ||
                        (Math.abs(dx) < width * 0.16 && dy >= height * 0.26 && dy < height * 0.29);
      const inWave1 = (dist > width * 0.32 && dist < width * 0.36 && Math.abs(dx) > width * 0.22 && dy < height * 0.1);

      if (inMicBody || inMicRing || inMicBase || inWave1) {
        r = iconColor[0];
        g = iconColor[1];
        b = iconColor[2];
      }

      raw.writeUInt8(Math.min(255, Math.max(0, r)), offset++);
      raw.writeUInt8(Math.min(255, Math.max(0, g)), offset++);
      raw.writeUInt8(Math.min(255, Math.max(0, b)), offset++);
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, chunk('IHDR', ihdr), idat, iend]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

// Generate PWA icons
fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, [99, 102, 241], [255, 255, 255]));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, [79, 70, 229], [255, 255, 255]));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, [67, 56, 202], [255, 255, 255]));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, [99, 102, 241], [255, 255, 255]));
fs.writeFileSync('./public/favicon.ico', createPNG(64, 64, [99, 102, 241], [255, 255, 255]));
console.log('Icons generated successfully');
