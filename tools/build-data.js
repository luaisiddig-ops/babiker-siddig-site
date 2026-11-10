// Converts data/manifest.json into assets/js/artworks-data.js (window.ARTWORKS)
// so the site works even when opened directly via file:// (no fetch/CORS needed).
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'data', 'manifest.json');
const outPath = path.join(__dirname, '..', 'assets', 'js', 'artworks-data.js');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const js = `// AUTO-GENERATED from data/manifest.json by tools/build-data.js — do not edit by hand.
window.ARTWORKS = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(outPath, js, 'utf-8');
console.log(`Wrote ${outPath} (${manifest.artworks.length} artworks, ${manifest.portraits.length} portraits)`);
