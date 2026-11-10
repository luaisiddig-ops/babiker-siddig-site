const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IN = path.join(__dirname, '..', '..', 'new-crops');
const OUT_ROOT = path.join(__dirname, '..', 'assets', 'images');
const THUMB_DIR = path.join(OUT_ROOT, 'thumb');
const WEB_DIR = path.join(OUT_ROOT, 'web');
const FULL_DIR = path.join(OUT_ROOT, 'full');
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'manifest.json');

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

// percentage trims: [leftPct, topPct, rightPct, bottomPct]
const FIXES = {
  'bs-086': { file: 'new-1-figures.png',        trim: [0, 0, 0, 3] },
  'bs-087': { file: 'new-2-doorway.png',        trim: [0, 0, 0, 3] },
  'bs-097': { file: 'new-12-threefaces.png',    trim: [3, 1, 10, 6] },
};

async function processOne(srcPath, id, trim) {
  const img = sharp(srcPath);
  const meta = await img.metadata();
  const W = meta.width, H = meta.height;
  const left = Math.round((trim[0] / 100) * W);
  const top = Math.round((trim[1] / 100) * H);
  const right = Math.round((trim[2] / 100) * W);
  const bottom = Math.round((trim[3] / 100) * H);
  const width = W - left - right;
  const height = H - top - bottom;

  const buf = await img.extract({ left, top, width, height }).toBuffer();
  const w = width, h = height;
  const orientation = w === h ? 'square' : (w > h ? 'landscape' : 'portrait');

  await sharp(buf).resize({ width: 560, withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(path.join(THUMB_DIR, `${id}.jpg`));

  const webResized = await sharp(buf).resize({ width: 1500, withoutEnlargement: true }).toBuffer();
  const webMeta = await sharp(webResized).metadata();
  await sharp(webResized).composite([{ input: watermarkSvg(webMeta.width, webMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 84, progressive: true, mozjpeg: true }).toFile(path.join(WEB_DIR, `${id}.jpg`));

  const fullResized = await sharp(buf).resize({ width: 2200, withoutEnlargement: true }).toBuffer();
  const fullMeta = await sharp(fullResized).metadata();
  await sharp(fullResized).composite([{ input: watermarkSvg(fullMeta.width, fullMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true }).toFile(path.join(FULL_DIR, `${id}.jpg`));

  return { width: w, height: h, orientation };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const byId = new Map(manifest.artworks.map(a => [a.id, a]));
  for (const [id, cfg] of Object.entries(FIXES)) {
    const srcPath = path.join(IN, cfg.file);
    process.stdout.write(`fixing ${id} <- ${cfg.file} trim=${JSON.stringify(cfg.trim)}\n`);
    const { width, height, orientation } = await processOne(srcPath, id, cfg.trim);
    const entry = byId.get(id);
    if (entry) { entry.width = width; entry.height = height; entry.orientation = orientation; }
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('Done.');
}
main().catch(e => { console.error(e); process.exit(1); });
