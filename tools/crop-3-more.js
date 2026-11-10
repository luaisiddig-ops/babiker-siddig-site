const sharp = require('sharp');
const path = require('path');
const PAGES = path.join(__dirname, '..', '..', 'pdf-pages');
const OUT = path.join(__dirname, '..', '..', 'new-crops');
require('fs').mkdirSync(OUT, { recursive: true });

async function crop(file, left, top, width, height, outName) {
  await sharp(path.join(PAGES, file)).extract({ left, top, width, height }).toFile(path.join(OUT, outName));
  console.log('wrote', outName);
}

async function main() {
  await crop('page-07.png', 2100, 285, 1800, 2805, 'new-10-tiedfigure-wide.png');
  await crop('page-08.png', 2115, 480, 1770, 2610, 'new-11-mortality-wide.png');
  await crop('page-09.png', 3300, 480, 2700, 2500, 'new-12-threefaces-wide.png');
}
main().catch(e => { console.error(e); process.exit(1); });
