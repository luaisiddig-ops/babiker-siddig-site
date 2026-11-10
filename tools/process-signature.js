const sharp = require('sharp');
const path = require('path');

const SRC = 'D:\\Bbabiker Siddig ARTEST\\WhatsApp Image 2026-11-01 at 6.34.39 PM.jpeg';
const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

async function main() {
  // Coarse manual crop first to exclude the unevenly-lit outer background
  // (the phone photo has shadowed corners that otherwise confuse thresholding).
  const coarse = await sharp(SRC)
    .rotate()
    .extract({ left: 200, top: 400, width: 700, height: 450 })
    .greyscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: grayData, info } = coarse;
  const { width, height } = info;

  // Binary alpha mask as raw bytes: dark ink -> 255 (opaque), light paper -> 0 (transparent).
  const THRESH = 150; // pixel value below this = ink
  const alphaRaw = Buffer.alloc(width * height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = grayData[y * width + x];
      const isInk = v < THRESH ? 255 : 0;
      alphaRaw[y * width + x] = isInk;
      if (isInk) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log('Ink bounding box:', minX, minY, maxX, maxY, 'of', width, height);

  const pad = 24;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width, maxX + pad) - cropX;
  const cropH = Math.min(height, maxY + pad) - cropY;

  const alphaCropped = await sharp(alphaRaw, { raw: { width, height, channels: 1 } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .toColourspace('b-w')
    .raw()
    .toBuffer();

  async function makeColored(hex, outName) {
    const { r, g, b } = hexToRgb(hex);
    const colorLayer = await sharp({
      create: { width: cropW, height: cropH, channels: 3, background: { r, g, b } }
    }).raw().toBuffer();
    await sharp(colorLayer, { raw: { width: cropW, height: cropH, channels: 3 } })
      .joinChannel(alphaCropped, { raw: { width: cropW, height: cropH, channels: 1 } })
      .png()
      .toFile(path.join(OUT_DIR, outName));
  }

  await makeColored('#1a1a1a', 'signature-ink.png');
  await makeColored('#c9a24b', 'signature-gold.png');

  console.log('done', cropW, 'x', cropH);
}
main().catch(e => { console.error(e); process.exit(1); });
