// Lists semicolons that sit in the site's own prose rather than inside a
// quotation, so they can be judged one at a time.
import fs from 'node:fs';
import path from 'node:path';

const DIRS = ['content/seerah', 'content/names', 'content/wisdom', 'content/duas'];
const files = [];
const walk = d => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.md')) files.push(p);
  }
};
DIRS.forEach(walk);

const FM = /^(arabic|translation|transliteration|source|reference|sources|title|snippet):/;
const mine = [];
let quoted = 0;

for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (!l.includes(';')) return;
    if (/^\s*>/.test(l) || FM.test(l.trim())) { quoted++; return; }
    // Strip emphasis spans: quoted scripture is nearly always italicised here.
    const bare = l.replace(/\*\*[^*]+\*\*/g, '').replace(/\*[^*]+\*/g, '');
    if (!bare.includes(';')) { quoted++; return; }
    mine.push(`${f.split(path.sep).join('/')}:${i + 1}  ${l.trim().slice(0, 130)}`);
  });
}

console.log(`in quotes or frontmatter (leave alone): ${quoted}`);
console.log(`in our own prose: ${mine.length}\n`);
mine.forEach(m => console.log('  ' + m));
