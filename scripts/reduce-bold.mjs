// Strips bold from phrases bolded for emphasis, which is the habit the style
// guide objects to. Bolding that does real work is kept:
//   - names and terms (Abu Bakr, al-Ahzab, Mi'raj)
//   - the lead-in of a list item
//   - table cells
//   - the owner's poems, untouched
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const DIRS = ['content/seerah', 'content/names', 'content/wisdom', 'content/duas'];
const SKIP = [path.join('content', 'wisdom', 'poem')];

const files = [];
const walk = d => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (SKIP.some(s => p.startsWith(s))) continue;
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.md')) files.push(p);
  }
};
DIRS.forEach(walk);

// Particles that appear inside names without a capital.
const PARTICLE = /^(ibn|bint|abi|abu|al|ad|an|ar|as|at|az|bin|ul|wa|l)[-']?$/i;

/** Is this bolded run a name or a short term, rather than a sentence? */
function isName(text) {
  const words = text.replace(/[.,!?;:()]/g, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 4) return false;
  return words.every(w => /^[A-Zʿ'"]/.test(w) || PARTICLE.test(w) || /^[A-Z]/.test(w.replace(/^[a-z]{1,2}-/, '')));
}

let changed = 0;
let stripped = 0;
const examples = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('**')) continue;

  let inFm = false;
  const out = raw.split('\n').map((line, i) => {
    if (/^---\s*$/.test(line) && (i === 0 || inFm)) { inFm = !inFm; return line; }
    if (inFm) return line;
    if (/^\s*\|/.test(line)) return line;                       // table row
    if (!line.includes('**')) return line;

    // A list item whose bold starts the content is a structural lead-in.
    const listLead = /^\s*(?:[-*+]|\d+\.)\s+\*\*/.test(line);

    let first = true;
    return line.replace(/\*\*([^*]+)\*\*/g, (m, text) => {
      const lead = first && listLead;
      first = false;
      if (lead || isName(text)) return m;
      stripped++;
      if (examples.length < 12) examples.push(`${path.basename(file)}: ${text.slice(0, 72)}`);
      return text;
    });
  }).join('\n');

  if (out !== raw) {
    changed++;
    if (!DRY) fs.writeFileSync(file, out, 'utf8');
  }
}

console.log(`${DRY ? 'would change' : 'changed'} ${changed} files, unbolded ${stripped} spans`);
examples.forEach(e => console.log('  ' + e));
