const sharp = require('sharp');
const path = require('path');
const IN = path.join(__dirname, '..', '..', 'new-crops');

async function trim(file, left, top, right, bottom, outName) {
  const img = sharp(path.join(IN, file));
  const meta = await img.metadata();
  const w = meta.width - left - right;
  const h = meta.height - top - bottom;
  await img.extract({ left, top, width: w, height: h }).toFile(path.join(IN, outName));
  console.log('wrote', outName, w, 'x', h);
}

async function main() {
  await trim('new-10-tiedfigure-wide.png', 6, 14, 6, 10, 'new-10-tiedfigure.png');
  await trim('new-11-mortality-wide.png', 6, 6, 6, 10, 'new-11-mortality.png');
  await trim('new-12-threefaces-wide.png', 8, 12, 45, 35, 'new-12-threefaces.png');
}
main().catch(e => { console.error(e); process.exit(1); });
