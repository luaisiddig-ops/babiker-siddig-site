// Re-derives clean (no-signature) base images for the 65 artworks that
// tools/add-signatures.js stamped, then re-composites the signature at a
// position that clears any visible canvas/paper/mat border instead of a
// blind fixed-% margin from the photo edge (which bled onto borders on some
// images, e.g. bs-086).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_JPG_DIR = 'D:\\Bbabiker Siddig ARTEST\\_jpg_converted';
const NEW_CROPS_DIR = path.join(ROOT, '..', 'new-crops');
const SIG_INK = path.join(ROOT, 'assets', 'images', 'signature-ink.png');
const SIG_GOLD = path.join(ROOT, 'assets', 'images', 'signature-gold.png');
const THUMB_DIR = path.join(ROOT, 'assets', 'images', 'thumb');
const WEB_DIR = path.join(ROOT, 'assets', 'images', 'web');
const FULL_DIR = path.join(ROOT, 'assets', 'images', 'full');
const MANIFEST_PATH = path.join(ROOT, 'data', 'manifest.json');

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

// Portfolio-pdf sourced ones: id -> { file (in new-crops), trim% (0 if already trimmed) }
const PORTFOLIO_MAP = {
  'bs-086': { file: 'new-1-figures.png', trim: 2 },
  'bs-087': { file: 'new-2-doorway.png', trim: 2 },
  'bs-088': { file: 'new-3-veiled.png', trim: 2 },
  'bs-089': { file: 'new-4-calligraphy.png', trim: 2.5 },
  'bs-090': { file: 'new-5-guitar.png', trim: 2 },
  'bs-091': { file: 'new-6-goatvillage.png', trim: 2 },
  'bs-092': { file: 'new-7-wave.png', trim: 2 },
  'bs-093': { file: 'new-8-woman-horse-bull.png', trim: 2 },
  'bs-094': { file: 'new-9-circles.png', trim: 2 },
  'bs-095': { file: 'new-10-tiedfigure.png', trim: 0 },
  'bs-096': { file: 'new-11-mortality.png', trim: 0 },
  'bs-097': { file: 'new-12-threefaces.png', trim: 0 },
};

const GOLD_IDS = new Set([
  'bs-049', 'bs-050', 'bs-051', 'bs-052', 'bs-053', 'bs-054',
  'bs-088', 'bs-089', 'bs-090', 'bs-091',
  'bs-095', 'bs-096', 'bs-097',
]);

const UNSIGNED_IDS_FULL = [
  'bs-001', 'bs-002', 'bs-003', 'bs-004', 'bs-005', 'bs-006', 'bs-007', 'bs-008', 'bs-009', 'bs-010',
  'bs-013', 'bs-014', 'bs-015', 'bs-016', 'bs-017', 'bs-018', 'bs-019', 'bs-020', 'bs-021', 'bs-022',
  'bs-023', 'bs-024', 'bs-025', 'bs-026', 'bs-027', 'bs-028', 'bs-029', 'bs-030', 'bs-031', 'bs-032',
  'bs-033', 'bs-034', 'bs-035', 'bs-036', 'bs-037', 'bs-038', 'bs-039', 'bs-040', 'bs-041', 'bs-042',
  'bs-043', 'bs-044', 'bs-045', 'bs-046', 'bs-047', 'bs-048', 'bs-049', 'bs-050', 'bs-051', 'bs-052',
  'bs-053', 'bs-054', 'bs-082',
  'bs-086', 'bs-087', 'bs-088', 'bs-089', 'bs-090', 'bs-091', 'bs-092', 'bs-093',
  'bs-094', 'bs-095', 'bs-096', 'bs-097',
];

async function getCleanBaseBuffer(id, manifest) {
  if (PORTFOLIO_MAP[id]) {
    const { file, trim } = PORTFOLIO_MAP[id];
    const srcPath = path.join(NEW_CROPS_DIR, file);
    const meta = await sharp(srcPath).metadata();
    if (trim > 0) {
      const t = trim / 100;
      const left = Math.round(meta.width * t);
      const top = Math.round(meta.height * t);
      const width = meta.width - left * 2;
      const height = meta.height - top * 2;
      return sharp(srcPath).extract({ left, top, width, height }).toBuffer();
    }
    return sharp(srcPath).toBuffer();
  }
  const entry = manifest.artworks.find(a => a.id === id);
  const srcPath = path.join(SRC_JPG_DIR, entry.sourceFile);
  return sharp(srcPath).rotate().toBuffer();
}

// Scan inward from the left edge and from the bottom edge, within the
// bottom-left quadrant, to find where a uniform (low color-variance) border
// strip ends and real painted/drawn content begins.
async function detectInset(buf) {
  const base = sharp(buf).rotate();
  const meta = await base.metadata();
  const regionW = Math.max(1, Math.round(meta.width * 0.16));
  const regionH = Math.max(1, Math.round(meta.height * 0.3));
  const { data, info } = await sharp(buf).rotate()
    .extract({ left: 0, top: meta.height - regionH, width: regionW, height: regionH })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const w = info.width, h = info.height;

  function colVariance(x) {
    let sum = 0, sumSq = 0, n = 0;
    for (let y = 0; y < h; y += 3) {
      const idx = (y * w + x) * ch;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      sum += lum; sumSq += lum * lum; n++;
    }
    const mean = sum / n;
    return sumSq / n - mean * mean;
  }
  function rowVariance(y) {
    let sum = 0, sumSq = 0, n = 0;
    for (let x = 0; x < w; x += 3) {
      const idx = (y * w + x) * ch;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      sum += lum; sumSq += lum * lum; n++;
    }
    const mean = sum / n;
    return sumSq / n - mean * mean;
  }

  // Require a run of consecutive low-variance samples before trusting that we've
  // left the border — a single noisy column/row (paper texture, a crease, a
  // shadow) must not be mistaken for "content started here".
  const VARIANCE_THRESHOLD = 140;
  const RUN_NEEDED = 12;
  let leftBorder = 0;
  {
    let run = 0;
    for (let x = 0; x < w; x++) {
      if (colVariance(x) > VARIANCE_THRESHOLD) run++; else run = 0;
      if (run >= RUN_NEEDED) { leftBorder = x - RUN_NEEDED + 1; break; }
      leftBorder = x + 1;
    }
  }
  let bottomBorder = 0;
  {
    let run = 0;
    for (let y = h - 1; y >= 0; y--) {
      if (rowVariance(y) > VARIANCE_THRESHOLD) run++; else run = 0;
      if (run >= RUN_NEEDED) { bottomBorder = (h - y) - RUN_NEEDED + 1; break; }
      bottomBorder = (h - y);
    }
  }
  // Cap how much we trust the detector (avoid runaway on a genuinely dark/flat painting area).
  leftBorder = Math.min(leftBorder, Math.round(meta.width * 0.18));
  bottomBorder = Math.min(bottomBorder, Math.round(meta.height * 0.18));
  return { leftBorderPx: leftBorder, bottomBorderPx: bottomBorder, width: meta.width, height: meta.height };
}

async function stampOne(cleanBuf, sigBuf, inset, targetWidth, isWatermarked) {
  const base = isWatermarked
    ? sharp(cleanBuf).resize({ width: targetWidth, withoutEnlargement: true })
    : sharp(cleanBuf).resize({ width: targetWidth, withoutEnlargement: true });
  const resizedBuf = await base.toBuffer();
  const meta = await sharp(resizedBuf).metadata();

  const scale = meta.width / inset.width;
  const leftBorderScaled = Math.round(inset.leftBorderPx * scale);
  const bottomBorderScaled = Math.round(inset.bottomBorderPx * scale);

  const baseMargin = Math.round(meta.width * 0.065);
  const buffer = Math.round(meta.width * 0.02);
  const left = Math.max(baseMargin, leftBorderScaled + buffer);
  const sigWidth = Math.round(meta.width * 0.12);
  const resizedSig = await sharp(sigBuf).resize({ width: sigWidth }).toBuffer();
  const sigMeta = await sharp(resizedSig).metadata();
  const marginBottom = Math.max(baseMargin, bottomBorderScaled + buffer);
  const top = meta.height - sigMeta.height - marginBottom;

  let composited = sharp(resizedBuf);
  const layers = [];
  if (isWatermarked) layers.push({ input: watermarkSvg(meta.width, meta.height), top: 0, left: 0 });
  layers.push({ input: resizedSig, left, top: Math.max(0, top) });
  composited = composited.composite(layers);
  return composited.jpeg({ quality: isWatermarked ? 85 : 78, progressive: true, mozjpeg: true }).toBuffer();
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const sigInkBuf = fs.readFileSync(SIG_INK);
  const sigGoldBuf = fs.readFileSync(SIG_GOLD);

  const testOnly = process.env.TEST_IDS ? process.env.TEST_IDS.split(',') : null;
  const UNSIGNED_IDS = testOnly || UNSIGNED_IDS_FULL;

  for (const id of UNSIGNED_IDS) {
    const cleanBuf = await getCleanBaseBuffer(id, manifest);
    const inset = await detectInset(cleanBuf);
    const sigBuf = GOLD_IDS.has(id) ? sigGoldBuf : sigInkBuf;

    const thumbBuf = await sharp(cleanBuf).rotate().resize({ width: 560, withoutEnlargement: true })
      .jpeg({ quality: 78, progressive: true, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(THUMB_DIR, `${id}.jpg`), thumbBuf);

    const rotatedClean = await sharp(cleanBuf).rotate().toBuffer();
    const webOut = await stampOne(rotatedClean, sigBuf, inset, 1500, true);
    fs.writeFileSync(path.join(WEB_DIR, `${id}.jpg`), webOut);

    const fullOut = await stampOne(rotatedClean, sigBuf, inset, 2200, true);
    fs.writeFileSync(path.join(FULL_DIR, `${id}.jpg`), fullOut);

    process.stdout.write(`${id}: leftBorder=${inset.leftBorderPx}px bottomBorder=${inset.bottomBorderPx}px (of ${inset.width}x${inset.height}) sig=${GOLD_IDS.has(id) ? 'gold' : 'ink'}\n`);
  }
  console.log(`\nDone. Re-stamped ${UNSIGNED_IDS.length} artworks.`);
}
main().catch(e => { console.error(e); process.exit(1); });
