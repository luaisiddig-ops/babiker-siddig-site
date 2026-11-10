// Fixes ink drawings that were photographed sideways (camera held landscape
// while the artwork itself is a portrait/vertical composition). Re-runs the
// same thumb/web/full pipeline as process-images.js, with an added 90deg CW
// rotation, and updates manifest.json width/height/orientation to match.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = 'D:\\Bbabiker Siddig ARTEST\\_jpg_converted';
const SITE_ROOT = path.join(__dirname, '..');
const OUT_ROOT = path.join(SITE_ROOT, 'assets', 'images');
const THUMB_DIR = path.join(OUT_ROOT, 'thumb');
const WEB_DIR = path.join(OUT_ROOT, 'web');
const FULL_DIR = path.join(OUT_ROOT, 'full');
const MANIFEST_PATH = path.join(SITE_ROOT, 'data', 'manifest.json');

// id -> source filename in SRC_DIR
const TARGETS = {
  'bs-068': 'IMG_0754.jpg',
  'bs-069': 'IMG_0755.jpg',
  'bs-070': 'IMG_0757.jpg',
  'bs-071': 'IMG_0758.jpg',
  'bs-072': 'IMG_0759.jpg',
  'bs-073': 'IMG_0760.jpg',
  'bs-074': 'IMG_0761.jpg',
  'bs-075': 'IMG_0762.jpg',
  'bs-076': 'IMG_0764.jpg',
  'bs-077': 'IMG_0765.jpg',
  'bs-078': 'IMG_0766.jpg',
  'bs-079': 'IMG_0767.jpg',
  'bs-080': 'IMG_0768.jpg',
  'bs-081': 'IMG_0769.jpg',
};

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

async function processOne(id, srcFile) {
  const srcPath = path.join(SRC_DIR, srcFile);
  // EXIF auto-orient, then rotate 90deg CW to correct the sideways shot
  const buf = await sharp(srcPath).rotate().rotate(90).toBuffer();
  const meta = await sharp(buf).metadata();
  const w = meta.width, h = meta.height;

  await sharp(buf)
    .resize({ width: 560, withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(path.join(THUMB_DIR, `${id}.jpg`));

  const webResized = await sharp(buf).resize({ width: 1500, withoutEnlargement: true }).toBuffer();
  const webMeta = await sharp(webResized).metadata();
  await sharp(webResized)
    .composite([{ input: watermarkSvg(webMeta.width, webMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(path.join(WEB_DIR, `${id}.jpg`));

  const fullResized = await sharp(buf).resize({ width: 2200, withoutEnlargement: true }).toBuffer();
  const fullMeta = await sharp(fullResized).metadata();
  await sharp(fullResized)
    .composite([{ input: watermarkSvg(fullMeta.width, fullMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(path.join(FULL_DIR, `${id}.jpg`));

  return { width: w, height: h };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const byId = new Map(manifest.artworks.map(a => [a.id, a]));

  for (const [id, srcFile] of Object.entries(TARGETS)) {
    process.stdout.write(`rotating ${id} <- ${srcFile}\n`);
    const { width, height } = await processOne(id, srcFile);
    const entry = byId.get(id);
    if (entry) {
      entry.width = width;
      entry.height = height;
      entry.orientation = 'portrait';
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nDone. Rotated ${Object.keys(TARGETS).length} artworks.`);
}

main().catch(err => { console.error(err); process.exit(1); });
