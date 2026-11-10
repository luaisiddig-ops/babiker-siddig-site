const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'pdf-crops', 'national-dress.png');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'portraits');

async function main() {
  // trim the thin frame-line sliver on the right edge
  const trimmed = await sharp(SRC)
    .extract({ left: 15, top: 10, width: 2669 - 160, height: 2826 - 70 })
    .toBuffer();

  await sharp(trimmed)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT_DIR, 'portrait-national.jpg'));

  await sharp(trimmed)
    .resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT_DIR, 'portrait-national-sm.jpg'));

  console.log('done');
}
main().catch(e => { console.error(e); process.exit(1); });
