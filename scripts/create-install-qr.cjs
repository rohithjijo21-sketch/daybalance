// Create a high-contrast installation QR using the QR encoder shipped with Expo's tools.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const candidates = [path.join(root, '.build-tools/node_modules/qrcode-terminal'), path.join(root, 'node_modules/qrcode-terminal'), path.join(root, 'node_modules/.pnpm/node_modules/qrcode-terminal')];
const encoder = candidates.find(p => fs.existsSync(path.join(p, 'vendor/QRCode/index.js')));
if (!encoder) throw new Error('Install project dependencies before generating the QR code');
const QRCode = require(path.join(encoder, 'vendor/QRCode'));
const levels = require(path.join(encoder, 'vendor/QRCode/QRErrorCorrectLevel'));
const url = process.argv[2];
if (!url || !url.startsWith('https://expo.dev/')) throw new Error('Provide the Expo installation URL');
const qr = new QRCode(-1, levels.M);
qr.addData(url);
qr.make();
const scale = 7, margin = 4, count = qr.getModuleCount(), size = (count + margin * 2) * scale;
const rows = Buffer.alloc((size + 1) * size, 255);
for (let y = 0; y < size; y++) {
  rows[y * (size + 1)] = 0;
  for (let x = 0; x < size; x++) {
    const my = Math.floor(y / scale) - margin, mx = Math.floor(x / scale) - margin;
    if (mx >= 0 && my >= 0 && mx < count && my < count && qr.isDark(my, mx)) rows[y * (size + 1) + x + 1] = 0;
  }
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const b of data) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
const output = path.resolve(process.argv[3] ?? path.join(root, 'DayBalance-install.png'));
fs.writeFileSync(output, png);
console.log(`Installation QR created: ${output} (${size} × ${size})`);
