// Adds size_cm / medium_ar / medium_en to every artwork per the artist's rules,
// and removes 3 artworks the artist asked to delete from the gallery entirely.
const fs = require('fs');
const path = require('path');
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'manifest.json');

const DELETE_TITLES_AR = ['حارس وفي', 'ابتسامة دافئة', 'غفوة الحرير'];
const CANVAS_TITLES_AR = ['جموح الحرية', 'فناء الجيرة'];

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const before = manifest.artworks.length;

  manifest.artworks = manifest.artworks.filter(a => !DELETE_TITLES_AR.includes(a.title_ar));
  const removed = before - manifest.artworks.length;

  let count = 0;
  manifest.artworks.forEach(a => {
    if (a.category === 'ink') {
      a.size_cm = '33×45';
      a.medium_ar = 'قلم حبر أسود على ورق كانسون';
      a.medium_en = 'Black ink pen on Canson paper';
    } else if (CANVAS_TITLES_AR.includes(a.title_ar)) {
      a.size_cm = '50×70';
      a.medium_ar = 'ألوان أكريليك على قماش';
      a.medium_en = 'Acrylic on canvas';
    } else {
      a.size_cm = '50×70';
      a.medium_ar = 'ألوان أكريليك على ورق كانسون';
      a.medium_en = 'Acrylic on Canson paper';
    }
    count++;
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Removed ${removed} artworks (expected 3). Updated size/medium on ${count} artworks.`);
  if (removed !== DELETE_TITLES_AR.length) {
    console.error('WARNING: expected to remove', DELETE_TITLES_AR.length, 'but removed', removed, '- check title_ar matches exactly.');
  }
}
main();
