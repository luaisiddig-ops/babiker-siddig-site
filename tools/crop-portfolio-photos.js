const sharp = require('sharp');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', '..', 'pdf-pages');
const OUT_DIR = path.join(__dirname, '..', '..', 'pdf-crops');
require('fs').mkdirSync(OUT_DIR, { recursive: true });

async function crop(file, left, top, width, height, outName) {
  await sharp(path.join(PAGES_DIR, file))
    .extract({ left, top, width, height })
    .toFile(path.join(OUT_DIR, outName));
  console.log('wrote', outName);
}

async function main() {
  // page-01: national dress cover photo (6000x3375 page)
  await crop('page-01.png', 3028, 267, 2669, 2826, 'national-dress.png');
}

main().catch(err => { console.error(err); process.exit(1); });
