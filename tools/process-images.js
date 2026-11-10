// Image pipeline for Babiker Siddig portfolio
// Reads source artworks + portraits, auto-orients, resizes to thumb/web/full,
// bakes a subtle copyright watermark into web/full artwork images, and writes manifest.json

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = 'D:\\Bbabiker Siddig ARTEST\\_jpg_converted';
const EXTRA_ARTWORKS = [
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 05.40.46_69c523b5.jpg',
  'D:\\Bbabiker Siddig ARTEST\\5990034267913785420_121.jpg',
];
const PORTRAIT_SOURCES = [
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.45.53_0613f3e3.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.45.55_cb82d5d3.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.45.57_66ccf6be.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.45.59_ae1668b4.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.46.00_1a80027f.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.46.00_afcf907a.jpg',
  'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2025-08-28 at 07.46.02_a175ec80.jpg',
];

const OUT_ROOT = path.join(__dirname, '..', 'assets', 'images');
const THUMB_DIR = path.join(OUT_ROOT, 'thumb');
const WEB_DIR = path.join(OUT_ROOT, 'web');
const FULL_DIR = path.join(OUT_ROOT, 'full');
const PORTRAIT_DIR = path.join(OUT_ROOT, 'portraits');

function watermarkSvg(w, h) {
  const fontSize = Math.max(14, Math.round(w * 0.018));
  const margin = Math.round(w * 0.025);
  return Buffer.from(`
    <svg width="${w}" height="${h}">
      <style>
        .wm { fill: #ffffff; fill-opacity: 0.55; font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; letter-spacing: 2px; }
        .wm-shadow { fill: #000000; fill-opacity: 0.35; font-family: Georgia, 'Times New Roman', serif; font-size: ${fontSize}px; letter-spacing: 2px; }
      </style>
      <text x="${w - margin + 1}" y="${h - margin + 1}" text-anchor="end" class="wm-shadow">&#169; Babiker Siddig</text>
      <text x="${w - margin}" y="${h - margin}" text-anchor="end" class="wm">&#169; Babiker Siddig</text>
    </svg>
  `);
}

async function processArtwork(srcPath, id) {
  const img = sharp(srcPath).rotate(); // auto-orient from EXIF, then strip
  const meta = await img.metadata();
  const oriented = sharp(srcPath).rotate();
  const buf = await oriented.toBuffer();
  const m2 = await sharp(buf).metadata();
  const w = m2.width, h = m2.height;
  const orientation = w === h ? 'square' : (w > h ? 'landscape' : 'portrait');

  // thumb (no watermark, fast grid loading)
  await sharp(buf)
    .resize({ width: 560, withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(path.join(THUMB_DIR, `${id}.jpg`));

  // web (watermarked)
  const webResized = await sharp(buf).resize({ width: 1500, withoutEnlargement: true }).toBuffer();
  const webMeta = await sharp(webResized).metadata();
  await sharp(webResized)
    .composite([{ input: watermarkSvg(webMeta.width, webMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(path.join(WEB_DIR, `${id}.jpg`));

  // full (watermarked, larger for lightbox zoom)
  const fullResized = await sharp(buf).resize({ width: 2200, withoutEnlargement: true }).toBuffer();
  const fullMeta = await sharp(fullResized).metadata();
  await sharp(fullResized)
    .composite([{ input: watermarkSvg(fullMeta.width, fullMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(path.join(FULL_DIR, `${id}.jpg`));

  return { id, sourceFile: path.basename(srcPath), width: w, height: h, orientation };
}

async function processPortrait(srcPath, id) {
  const buf = await sharp(srcPath).rotate().toBuffer();
  const meta = await sharp(buf).metadata();
  await sharp(buf)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(path.join(PORTRAIT_DIR, `${id}.jpg`));
  await sharp(buf)
    .resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(path.join(PORTRAIT_DIR, `${id}-sm.jpg`));
  return { id, sourceFile: path.basename(srcPath), width: meta.width, height: meta.height };
}

async function main() {
  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpg'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const allArtworkSrcs = [...files.map(f => path.join(SRC_DIR, f)), ...EXTRA_ARTWORKS];

  const artworks = [];
  let n = 1;
  for (const srcPath of allArtworkSrcs) {
    const id = `bs-${String(n).padStart(3, '0')}`;
    process.stdout.write(`artwork ${id} <- ${path.basename(srcPath)}\n`);
    const result = await processArtwork(srcPath, id);
    artworks.push(result);
    n++;
  }

  const portraits = [];
  let p = 1;
  for (const srcPath of PORTRAIT_SOURCES) {
    const id = `portrait-${p}`;
    process.stdout.write(`portrait ${id} <- ${path.basename(srcPath)}\n`);
    const result = await processPortrait(srcPath, id);
    portraits.push(result);
    p++;
  }

  fs.writeFileSync(
    path.join(__dirname, '..', 'data', 'manifest.json'),
    JSON.stringify({ artworks, portraits }, null, 2),
    'utf-8'
  );
  console.log(`\nDone. ${artworks.length} artworks, ${portraits.length} portraits.`);
}

main().catch(err => { console.error(err); process.exit(1); });
