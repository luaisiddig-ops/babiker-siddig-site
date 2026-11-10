// The dark-ink signature is illegible against the busy black-on-white
// cross-hatching of his monochrome ink/pen drawings (confirmed visually on
// bs-049: mean brightness looked fine but the dense linework swallowed it).
// Re-stamp just these "ink" category pieces with the gold variant instead,
// which reads clearly against any density of black ink linework. Same
// placement math as add-signatures.js so it draws exactly over the old,
// now-hidden-underneath black stamp.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SIG = path.join(ROOT, 'assets', 'images', 'signature-gold.png');
const WEB_DIR = path.join(ROOT, 'assets', 'images', 'web');
const FULL_DIR = path.join(ROOT, 'assets', 'images', 'full');

const INK_IDS = [
  'bs-049','bs-050','bs-051','bs-052','bs-053','bs-054',
  'bs-088','bs-089','bs-090','bs-091',
  'bs-095','bs-096','bs-097',
];

async function stampFile(filePath, sigBuffer) {
  const img = sharp(filePath);
  const meta = await img.metadata();
  const sigWidth = Math.round(meta.width * 0.12);
  const resizedSig = await sharp(sigBuffer).resize({ width: sigWidth }).toBuffer();
  const sigMeta = await sharp(resizedSig).metadata();
  const margin = Math.round(meta.width * 0.025);
  const left = margin;
  const top = meta.height - sigMeta.height - margin;
  await img
    .composite([{ input: resizedSig, left, top }])
    .toBuffer()
    .then(buf => sharp(buf).jpeg({ quality: 90, progressive: true, mozjpeg: true }).toFile(filePath + '.tmp'))
    .then(() => fs.renameSync(filePath + '.tmp', filePath));
}

async function main() {
  const sigBuffer = fs.readFileSync(SIG);
  for (const id of INK_IDS) {
    const webPath = path.join(WEB_DIR, `${id}.jpg`);
    const fullPath = path.join(FULL_DIR, `${id}.jpg`);
    if (fs.existsSync(webPath)) { await stampFile(webPath, sigBuffer); }
    if (fs.existsSync(fullPath)) { await stampFile(fullPath, sigBuffer); }
    process.stdout.write(`re-stamped (gold) ${id}\n`);
  }
  console.log(`Done. Re-stamped ${INK_IDS.length} ink-category artworks with gold signature.`);
}
main().catch(e => { console.error(e); process.exit(1); });
