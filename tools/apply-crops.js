// Applies data/crop-rects.json (percentage crop boxes) to the ORIGINAL source files
// for the given artwork ids, regenerating thumb/web/full for just those ids.
// Does NOT touch any other field already enriched in data/manifest.json
// (category, title_ar/en, alt_ar/en, duplicateGroup, isPrimary) — only updates width/height.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = 'D:\\Bbabiker Siddig ARTEST\\_jpg_converted';
const EXTRA_ARTWORKS_DIR = 'D:\\Bbabiker Siddig ARTEST';

const OUT_ROOT = path.join(__dirname, '..', 'assets', 'images');
const THUMB_DIR = path.join(OUT_ROOT, 'thumb');
const WEB_DIR = path.join(OUT_ROOT, 'web');
const FULL_DIR = path.join(OUT_ROOT, 'full');

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'manifest.json');
const CROPS_PATH = path.join(__dirname, '..', 'data', 'crop-rects.json');

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

function resolveSourcePath(sourceFile) {
  const inConverted = path.join(SRC_DIR, sourceFile);
  if (fs.existsSync(inConverted)) return inConverted;
  const inRoot = path.join(EXTRA_ARTWORKS_DIR, sourceFile);
  if (fs.existsSync(inRoot)) return inRoot;
  throw new Error(`source file not found for ${sourceFile}`);
}

async function processCroppedArtwork(srcPath, id, cropPct) {
  const oriented = sharp(srcPath).rotate();
  const buf = await oriented.toBuffer();
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;

  const left = Math.round((cropPct.left / 100) * W);
  const top = Math.round((cropPct.top / 100) * H);
  const width = Math.max(1, Math.min(W - left, Math.round((cropPct.width / 100) * W)));
  const height = Math.max(1, Math.min(H - top, Math.round((cropPct.height / 100) * H)));

  const croppedBuf = await sharp(buf).extract({ left, top, width, height }).toBuffer();
  const croppedMeta = await sharp(croppedBuf).metadata();
  const w = croppedMeta.width, h = croppedMeta.height;
  const orientation = w === h ? 'square' : (w > h ? 'landscape' : 'portrait');

  await sharp(croppedBuf)
    .resize({ width: 560, withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(path.join(THUMB_DIR, `${id}.jpg`));

  const webResized = await sharp(croppedBuf).resize({ width: 1500, withoutEnlargement: true }).toBuffer();
  const webMeta = await sharp(webResized).metadata();
  await sharp(webResized)
    .composite([{ input: watermarkSvg(webMeta.width, webMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(path.join(WEB_DIR, `${id}.jpg`));

  const fullResized = await sharp(croppedBuf).resize({ width: 2200, withoutEnlargement: true }).toBuffer();
  const fullMeta = await sharp(fullResized).metadata();
  await sharp(fullResized)
    .composite([{ input: watermarkSvg(fullMeta.width, fullMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(path.join(FULL_DIR, `${id}.jpg`));

  return { width: w, height: h, orientation };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const crops = JSON.parse(fs.readFileSync(CROPS_PATH, 'utf-8'));

  const byId = new Map(manifest.artworks.map(a => [a.id, a]));
  let count = 0;

  for (const [id, rect] of Object.entries(crops)) {
    const entry = byId.get(id);
    if (!entry) { console.warn(`skip ${id}: not found in manifest`); continue; }
    const srcPath = resolveSourcePath(entry.sourceFile);
    process.stdout.write(`cropping ${id} <- ${entry.sourceFile} (${JSON.stringify(rect)})\n`);
    const { width, height, orientation } = await processCroppedArtwork(srcPath, id, rect);
    entry.width = width;
    entry.height = height;
    entry.orientation = orientation;
    count++;
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nDone. Cropped and regenerated ${count} artworks. Manifest updated (width/height/orientation only).`);
}

main().catch(err => { console.error(err); process.exit(1); });
