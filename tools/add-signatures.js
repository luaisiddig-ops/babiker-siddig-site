// Composites the artist's handwritten signature onto artwork photos that do
// NOT already show a signature in the photographed piece. Determined by
// visually inspecting every artwork's web/{id}.jpg — IDs below are the ones
// judged unsigned. (Signed ones, left untouched, include bs-011/012/084 which
// show a painted "B.SIDDIG" signature, and the bs-057..bs-081/085/068 range of
// figurative ink drawings which each carry his cursive signature + geometric
// monogram in the bottom corners of the photographed sheet.)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SIG = path.join(ROOT, 'assets', 'images', 'signature-ink.png');
const WEB_DIR = path.join(ROOT, 'assets', 'images', 'web');
const FULL_DIR = path.join(ROOT, 'assets', 'images', 'full');

const UNSIGNED_IDS = [
  'bs-001','bs-002','bs-003','bs-004','bs-005','bs-006','bs-007','bs-008','bs-009','bs-010',
  'bs-013','bs-014','bs-015','bs-016','bs-017','bs-018','bs-019','bs-020','bs-021','bs-022',
  'bs-023','bs-024','bs-025','bs-026','bs-027','bs-028','bs-029','bs-030','bs-031','bs-032',
  'bs-033','bs-034','bs-035','bs-036','bs-037','bs-038','bs-039','bs-040','bs-041','bs-042',
  'bs-043','bs-044','bs-045','bs-046','bs-047','bs-048','bs-049','bs-050','bs-051','bs-052',
  'bs-053','bs-054','bs-082',
  'bs-086','bs-087','bs-088','bs-089','bs-090','bs-091','bs-092','bs-093',
  'bs-094','bs-095','bs-096','bs-097',
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
  let count = 0;
  for (const id of UNSIGNED_IDS) {
    const webPath = path.join(WEB_DIR, `${id}.jpg`);
    const fullPath = path.join(FULL_DIR, `${id}.jpg`);
    if (fs.existsSync(webPath)) { await stampFile(webPath, sigBuffer); }
    if (fs.existsSync(fullPath)) { await stampFile(fullPath, sigBuffer); }
    count++;
    process.stdout.write(`signed ${id}\n`);
  }
  console.log(`Done. Stamped ${count} artworks (web+full).`);
}
main().catch(e => { console.error(e); process.exit(1); });
