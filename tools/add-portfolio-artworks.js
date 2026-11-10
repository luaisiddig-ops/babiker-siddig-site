// Processes the 9 newly-extracted portfolio artworks (crops already made by
// tools/crop-new-artworks.js into ../../new-crops/) into the site's image
// pipeline, and appends new entries to data/manifest.json.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CROPS_DIR = path.join(__dirname, '..', '..', 'new-crops');
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

// id, source crop file, trim% (uniform inset to shave off residual border), category, titles, alts
const ITEMS = [
  {
    file: 'new-1-figures.png', trim: 2,
    category: 'figurative',
    title_ar: 'ظلال العابرين', title_en: 'Shadows of the Passersby',
    alt_ar: 'لوحة تعبيرية بالأخضر والأحمر لمجموعة أشخاص واقفين متراصين',
    alt_en: 'Expressive painting in green and red of a cluster of standing figures',
  },
  {
    file: 'new-2-doorway.png', trim: 2,
    category: 'figurative',
    title_ar: 'عتبة النوبة', title_en: 'Threshold of Nubia',
    alt_ar: 'لوحة لباب طيني نوبي بزخارف هندسية ووجه امرأة عند العتبة',
    alt_en: 'Painting of a Nubian mudbrick doorway with geometric ornament and a woman\'s face at the threshold',
  },
  {
    file: 'new-3-veiled.png', trim: 2,
    category: 'ink',
    title_ar: 'مظلة الذاكرة', title_en: 'Canopy of Memory',
    alt_ar: 'رسم بالحبر لوجه امرأة كبير فوق صف من النساء المحجبات تحت مظلة زخرفية',
    alt_en: 'Ink drawing of a large woman\'s face above a row of veiled women beneath a decorative canopy',
  },
  {
    file: 'new-4-calligraphy.png', trim: 2.5,
    category: 'ink',
    title_ar: 'سمكة القدر', title_en: 'Fish of Destiny',
    alt_ar: 'رسم بالحبر تجريدي بخط عربي متدفق وهيئة سمكة أو طائر وقرص مضيء',
    alt_en: 'Abstract ink drawing with flowing Arabic script, a bird-or-fish silhouette, and a glowing disc',
  },
  {
    file: 'new-5-guitar.png', trim: 2,
    category: 'ink',
    title_ar: 'أنشودة العود', title_en: 'Song of the Oud',
    alt_ar: 'رسم بالحبر لامرأة تعزف على آلة وترية قرب قناع قبلي على الحائط',
    alt_en: 'Ink drawing of a woman playing a stringed instrument beside a tribal mask on the wall',
  },
  {
    file: 'new-6-goatvillage.png', trim: 2,
    category: 'ink',
    title_ar: 'جارات القرية', title_en: 'Neighbours of the Village',
    alt_ar: 'رسم بالحبر لمجموعة نساء وفتاة وعنزة أمام بيوت القرية والأشجار',
    alt_en: 'Ink drawing of a group of women, a girl and a goat before the village houses and trees',
  },
  {
    file: 'new-7-wave.png', trim: 2,
    category: 'abstract',
    title_ar: 'موجة الجسد', title_en: 'Wave of the Body',
    alt_ar: 'لوحة تجريدية بألوان مائية دافئة لشكل جسد متموج بين الألوان',
    alt_en: 'Abstract watercolor painting of a flowing body-like form amid warm waves of colour',
  },
  {
    file: 'new-8-woman-horse-bull.png', trim: 2,
    category: 'abstract',
    title_ar: 'حراس البرية', title_en: 'Guardians of the Wild',
    alt_ar: 'لوحة تجريدية لوجه امرأة مع حصان وثور بألوان أخضر وأزرق وذهبي',
    alt_en: 'Abstract painting of a woman\'s face with a horse and a bull in green, blue and gold',
  },
  {
    file: 'new-9-circles.png', trim: 2,
    category: 'abstract',
    title_ar: 'أقمار متوهجة', title_en: 'Glowing Moons',
    alt_ar: 'لوحة تجريدية لكرات ملونة متراصة على خلفية سوداء',
    alt_en: 'Abstract painting of clustered luminous spheres against a black ground',
  },
];

async function processItem(item, id) {
  const srcPath = path.join(CROPS_DIR, item.file);
  const meta = await sharp(srcPath).metadata();
  const W = meta.width, H = meta.height;
  const t = item.trim / 100;
  const left = Math.round(W * t);
  const top = Math.round(H * t);
  const width = W - left * 2;
  const height = H - top * 2;

  const buf = await sharp(srcPath).extract({ left, top, width, height }).toBuffer();
  const m2 = await sharp(buf).metadata();
  const w = m2.width, h = m2.height;
  const orientation = w === h ? 'square' : (w > h ? 'landscape' : 'portrait');

  await sharp(buf)
    .resize({ width: 560, withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(path.join(THUMB_DIR, `${id}.jpg`));

  const webResized = await sharp(buf).resize({ width: 1500, withoutEnlargement: true }).toBuffer();
  const webMeta = await sharp(webResized).metadata();
  await sharp(webResized)
    .composite([{ input: watermarkSvg(webMeta.width, webMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(path.join(WEB_DIR, `${id}.jpg`));

  const fullResized = await sharp(buf).resize({ width: 2200, withoutEnlargement: true }).toBuffer();
  const fullMeta = await sharp(fullResized).metadata();
  await sharp(fullResized)
    .composite([{ input: watermarkSvg(fullMeta.width, fullMeta.height), top: 0, left: 0 }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(path.join(FULL_DIR, `${id}.jpg`));

  return { width: w, height: h, orientation };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const existingIds = manifest.artworks.map(a => parseInt(a.id.replace('bs-', ''), 10));
  let n = Math.max(...existingIds) + 1;

  for (const item of ITEMS) {
    const id = `bs-${String(n).padStart(3, '0')}`;
    process.stdout.write(`processing ${id} <- ${item.file}\n`);
    const { width, height, orientation } = await processItem(item, id);
    manifest.artworks.push({
      id,
      sourceFile: `portfolio-pdf-${item.file}`,
      width, height, orientation,
      category: item.category,
      title_ar: item.title_ar, title_en: item.title_en,
      alt_ar: item.alt_ar, alt_en: item.alt_en,
    });
    n++;
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nDone. Added ${ITEMS.length} new artworks to manifest.json.`);
}

main().catch(err => { console.error(err); process.exit(1); });
