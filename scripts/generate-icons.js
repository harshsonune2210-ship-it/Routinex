import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, innerR, innerG, innerB) {
  // Simple uncompressed/deflated raw RGBA PNG writer
  const buffer = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    buffer[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInner = dist < width * 0.35;
      const isRing = dist >= width * 0.36 && dist <= width * 0.42;

      if (isRing) {
        buffer[offset++] = 16;  // R: emerald
        buffer[offset++] = 185; // G
        buffer[offset++] = 129; // B
        buffer[offset++] = 255;
      } else if (isInner) {
        buffer[offset++] = innerR;
        buffer[offset++] = innerG;
        buffer[offset++] = innerB;
        buffer[offset++] = 255;
      } else {
        buffer[offset++] = r;
        buffer[offset++] = g;
        buffer[offset++] = b;
        buffer[offset++] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(buffer);

  // PNG Signature
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/icon-192.png', createPNG(192, 192, 9, 10, 15, 34, 197, 94));
fs.writeFileSync('./public/icon-512.png', createPNG(512, 512, 9, 10, 15, 34, 197, 94));
fs.writeFileSync('./public/icon-maskable-512.png', createPNG(512, 512, 7, 8, 11, 16, 185, 129));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, 9, 10, 15, 34, 197, 94));

console.log('PNG Icons successfully generated.');
