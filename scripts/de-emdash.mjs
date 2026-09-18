// Replaces em dashes with commas in the site's own prose.
//
//   node scripts/de-emdash.mjs --dry
//   node scripts/de-emdash.mjs
//
// Markdown only. Source files are left alone, because an em dash can sit inside
// a regex literal and a blind edit breaks it.
//
// Never touched:
//   content/tafsir/**        the owner's notes
//   content/wisdom/poem/**   the owner's poems
//   blockquote lines         quoted scripture, hadith and poetry
//   arabic / translation / transliteration frontmatter, which come from the APIs
//
// A comma is used rather than a full stop: nearly every em dash here introduces
// an appositive or a parenthetical, where a comma is right. The handful that
// join two independent clauses are listed at the end for fixing by hand.
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const ROOT = process.cwd();

const SKIP = [
  path.join('content', 'tafsir'),
  path.join('content', 'wisdom', 'poem'),
  'node_modules', '.next', 'reference', 'data',
];

const PROTECTED = /^(arabic|translation|transliteration):/;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const rel = path.relative(ROOT, p);
    if (SKIP.some(s => rel === s || rel.startsWith(s + path.sep))) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (f.endsWith('.md')) out.push(p);
  }
  return out;
}

// After the substitution, a comma between two finite clauses is a splice and
// needs a person to look at it. This spots the common shapes.
const SPLICE = /,\s+(it|that|this|he|she|they|we|you|there|the\s+\w+)\s+(is|are|was|were|has|have|had|does|do|did|will|would|can|could)\b/i;

let changed = 0;
let count = 0;
const splices = [];

for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('—')) continue;

  let inFm = false;
  let prot = false;
  const lines = raw.split('\n').map((line, i) => {
    if (/^---\s*$/.test(line) && (i === 0 || inFm)) { inFm = !inFm; prot = false; return line; }
    if (inFm) {
      if (/^\S/.test(line)) prot = PROTECTED.test(line);
      if (prot) return line;
    }
    if (/^\s*>/.test(line)) return line;              // blockquote
    if (!line.includes('—')) return line;

    count += (line.match(/—/g) || []).length;
    // Only the dash and the spaces immediately around it are touched, so
    // indentation and the rest of the line are untouched.
    const next = line
      .replace(/ *— */g, ', ')
      .replace(/,\s*,/g, ',')
      .replace(/\s+,/g, ',')
      .replace(/,\s*([.;:!?])/g, '$1');

    if (SPLICE.test(next)) splices.push(`${path.relative(ROOT, file)}:${i + 1}  ${next.trim().slice(0, 110)}`);
    return next;
  });

  const out = lines.join('\n');
  if (out !== raw) {
    changed++;
    if (!DRY) fs.writeFileSync(file, out, 'utf8');
  }
}

console.log(`${DRY ? 'would change' : 'changed'} ${changed} files, ${count} em dashes`);
if (splices.length) {
  console.log(`\n${splices.length} possible comma splices to review by hand:`);
  splices.forEach(s => console.log('  ' + s));
}
