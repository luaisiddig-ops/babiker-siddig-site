const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PAGES_DIR = 'D:\\Claude\\حزمة-الدورة-ملفات-مستقلة\\pdf-pages';
const OUT_DIR = path.join(__dirname, '..', '..', 'new-crops');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function crop(file, left, top, width, height, outName) {
  await sharp(path.join(PAGES_DIR, file))
    .extract({ left, top, width, height })
    .toFile(path.join(OUT_DIR, outName));
  console.log('wrote', outName);
}

async function main() {
  await crop('page-05.png', 630, 690, 1635, 2010, 'new-1-figures.png');
  await crop('page-05.png', 2325, 690, 1635, 2010, 'new-2-doorway.png');
  await crop('page-05.png', 3990, 690, 1665, 2010, 'new-3-veiled.png');
  await crop('page-06.png', 2280, 540, 1740, 2160, 'new-4-calligraphy.png');
  await crop('page-07.png', 3990, 225, 1080, 1590, 'new-5-guitar.png');
  await crop('page-07.png', 3990, 1875, 1080, 1290, 'new-6-goatvillage.png');
  await crop('page-10.png', 225, 750, 1500, 1920, 'new-7-wave.png');
  await crop('page-10.png', 1755, 750, 2580, 1920, 'new-8-woman-horse-bull.png');
  await crop('page-10.png', 4380, 750, 1380, 1920, 'new-9-circles.png');
}
main().catch(e => { console.error(e); process.exit(1); });
