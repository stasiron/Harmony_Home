// Ikony aplikacji (PWA, ekran główny iPhone'a/Androida) — bez zależności:
// domek z kresek rysowany funkcją odległości, wygładzany nadpróbkowaniem,
// zapisany jako PNG przez zlib. Uruchom: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BG_TOP = [0x2a, 0x20, 0x17];
const BG_BOTTOM = [0x1a, 0x13, 0x0d];
const AMBER = [0xf2, 0xb0, 0x4c];

// Domek w układzie 24 × 24 (jak ikona Home w aplikacji)
const SEGMENTS = [
  // dach
  [3, 10.5, 12, 3],
  [12, 3, 21, 10.5],
  // ściany i podłoga
  [5.5, 9, 5.5, 20.5],
  [5.5, 20.5, 18.5, 20.5],
  [18.5, 20.5, 18.5, 9],
  // drzwi
  [10, 20.5, 10, 14.5],
  [10, 14.5, 14, 14.5],
  [14, 14.5, 14, 20.5],
];
const STROKE = 1.7;

function distToSegment(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** @param scale ile ikony zajmuje domek (maskable: mniej, bezpieczna strefa) */
function render(size, scale) {
  const pixels = Buffer.alloc(size * size * 4);
  const SS = 4; // nadpróbkowanie na krawędziach
  const box = size * scale;
  const offset = (size - box) / 2;
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const bg = BG_TOP.map((c, i) => Math.round(c + (BG_BOTTOM[i] - c) * t));
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = ((x + (sx + 0.5) / SS - offset) / box) * 24;
          const uy = ((y + (sy + 0.5) / SS - offset) / box) * 24;
          if (SEGMENTS.some((s) => distToSegment(ux, uy, s) <= STROKE / 2)) {
            hits++;
          }
        }
      }
      const a = hits / (SS * SS);
      const o = (y * size + x) * 4;
      for (let i = 0; i < 3; i++) {
        pixels[o + i] = Math.round(bg[i] + (AMBER[i] - bg[i]) * a);
      }
      pixels[o + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bity na kanał
  header[9] = 6; // RGBA
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // filtr: brak
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });
const icons = [
  ["icon-192.png", 192, 0.62],
  ["icon-512.png", 512, 0.62],
  // Android przycina maskable do koła — domek w bezpiecznej strefie 80%
  ["maskable-512.png", 512, 0.5],
  ["apple-touch-icon.png", 180, 0.6],
  ["favicon-32.png", 32, 0.8],
];
for (const [name, size, scale] of icons) {
  writeFileSync(`${OUT}/${name}`, png(size, render(size, scale)));
  console.log(`${OUT}/${name}`);
}
