// Splits an authored bundle into individual content files.
// Bundle format: lines of "===== FILE: <relative/path> =====" followed by the file body.
import fs from 'node:fs';
import path from 'node:path';

const [bundle, outRoot] = process.argv.slice(2);
if (!bundle || !outRoot) { console.error('usage: split-content.mjs <bundle> <outRoot>'); process.exit(1); }

const text = fs.readFileSync(bundle, 'utf8');
const parts = text.split(/^=====\s*FILE:\s*(.+?)\s*=====$/m);
let n = 0;
for (let i = 1; i < parts.length; i += 2) {
  const rel = parts[i].trim();
  const body = parts[i + 1].replace(/^\n/, '').replace(/\s*$/, '') + '\n';
  const dest = path.join(outRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body, 'utf8');
  n++;
}
console.log(`wrote ${n} files under ${outRoot}`);
