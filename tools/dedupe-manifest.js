const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, '..', 'data', 'manifest.json');

const groups = [
  { members: ['bs-001', 'bs-002', 'bs-003'], primary: 'bs-001' },
  { members: ['bs-005', 'bs-006'], primary: 'bs-005' },
  { members: ['bs-007', 'bs-008'], primary: 'bs-007' },
  { members: ['bs-011', 'bs-012', 'bs-084'], primary: 'bs-011' },
  { members: ['bs-015', 'bs-016'], primary: 'bs-015' },
  { members: ['bs-017', 'bs-018'], primary: 'bs-017' },
  { members: ['bs-020', 'bs-021'], primary: 'bs-020' },
  { members: ['bs-027', 'bs-028'], primary: 'bs-027' },
  { members: ['bs-031', 'bs-032'], primary: 'bs-031' },
  { members: ['bs-035', 'bs-036'], primary: 'bs-035' },
  { members: ['bs-038', 'bs-039'], primary: 'bs-038' },
  { members: ['bs-040', 'bs-041'], primary: 'bs-040' },
  { members: ['bs-070', 'bs-071'], primary: 'bs-070' },
  { members: ['bs-081', 'bs-085'], primary: 'bs-081' },
];

const data = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
const byId = new Map(data.artworks.map(a => [a.id, a]));

let touched = 0;
for (const g of groups) {
  for (const id of g.members) {
    const art = byId.get(id);
    if (!art) throw new Error(`Missing id ${id}`);
    art.duplicateGroup = g.primary;
    art.isPrimary = (id === g.primary);
    touched++;
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2), 'utf-8');

const uniqueCount = data.artworks.filter(a => !a.duplicateGroup || a.isPrimary).length;
console.log(`Touched ${touched} artworks across ${groups.length} groups.`);
console.log(`Total artworks: ${data.artworks.length}. Unique (primary or no group): ${uniqueCount}.`);
