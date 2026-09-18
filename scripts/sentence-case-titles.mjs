// Seerah chapter titles were written in Title Case. This lowercases the
// ordinary words and leaves proper nouns alone.
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const DIR = 'content/seerah';

// Anything genuinely a name: people, places, events, tribes.
const PROPER = new Set([
  'halimah', 'aminah', 'abdul', 'muttalib', 'abu', 'talib', 'syria', 'bahira',
  'hilf', 'al-fudul', 'al-amin', 'khadijah', 'prophet', "prophet's", "ka'bah",
  'hira', 'safa', 'mount', 'abyssinia', "ja'far", 'negus', 'hamzah', 'umar',
  'islam', "utbah's", "ta'if", 'al-isra', "al-mi'raj", 'aqabah', 'thawr',
  'quba', 'madinah', 'muhajirun', 'ansar', 'badr', 'uhud', 'banu', 'qaynuqa',
  'an-nadir', 'qurayzah', 'hudaybiyah', 'khaybar', 'umrah', 'makkah', 'hunayn',
  'tabuk', 'elephant', 'qiblah', 'allah', 'jibril', 'muhammad',
]);

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
let changed = 0;

for (const f of files) {
  const p = path.join(DIR, f);
  const raw = fs.readFileSync(p, 'utf8');

  const out = raw.replace(/^title:\s*"(.+)"\s*$/m, (m, title) => {
    const words = title.split(' ');
    const next = words.map((w, i) => {
      if (i === 0) return w;
      const bare = w.replace(/[",.]/g, '').toLowerCase();
      if (PROPER.has(bare)) return w;
      // Keep anything already hyphenated with an Arabic article, e.g. al-Mi'raj.
      if (/^(al|an|ar|as|ad|at|az)-/i.test(bare)) return w;
      return w.charAt(0).toLowerCase() + w.slice(1);
    }).join(' ');
    return `title: "${next}"`;
  });

  if (out !== raw) {
    changed++;
    if (!DRY) fs.writeFileSync(p, out, 'utf8');
  }
}

console.log(`${DRY ? 'would change' : 'changed'} ${changed} titles`);
console.log(fs.readdirSync(DIR).filter(f => f.endsWith('.md')).slice(0, 0));
