// Adds a market-informed price range (USD) per artwork, based on category tier.
// Tiers derived from comparable sales of similarly-positioned Sudanese/East-African
// artists of the same generation (regional auction estimates for ink/pastel works
// by artists b.1950s-60s with multi-country exhibition history, direct-to-collector
// pricing set below auction-house level to build a buyer base).
const fs = require('fs');
const path = require('path');
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'manifest.json');

const TIERS = {
  ink:        [250, 600],
  landscape:  [350, 700],
  'still-life':[350, 700],
  figurative: [450, 900],
  abstract:   [500, 1200],
  portrait:   [800, 2000],
};

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  let count = 0;
  manifest.artworks.forEach(a => {
    if (a.isPrimary === false) return; // skip hidden duplicates
    const tier = TIERS[a.category] || [400, 800];
    a.price_min_usd = tier[0];
    a.price_max_usd = tier[1];
    count++;
  });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Priced ${count} artworks.`);
}
main();
