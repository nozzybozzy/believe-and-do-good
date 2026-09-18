// Parses the Master Index of the 114 Surahs out of the owner's Core Themes PDF
// into data/surah-themes.json — primary category, secondary categories and the
// recurring logics, per surah.
//
//   node scripts/parse-core-themes-index.mjs
//
// The table is two columns in the PDF, and `pdftotext -layout` misaligns the
// right column vertically. Content order (no -layout) is unambiguous instead:
// cells come out in a fixed sequence, with the right column's data arriving at
// the end as two long runs. Entries inside a run are separated by the trailing
// comma convention — "§7 §3, §6 §6 §3" is one entry of §7/(§3,§6) then §6/(§3).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDF = process.argv[2] ||
  'C:/Users/nozmu/Downloads/Quran Tafsir/Core-Themes-of-the-Quran-Synthesis-v3.pdf';
const OUT = path.join(process.cwd(), 'data', 'surah-themes.json');

const page = n =>
  execFileSync('pdftotext', ['-enc', 'UTF-8', '-f', String(n), '-l', String(n), PDF, '-'], {
    encoding: 'utf8',
    maxBuffer: 1 << 24,
  })
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

/**
 * Category cells are "primary secondary" pairs with nothing between entries —
 * "§6 §3 §6 §1" is two cells, not four. A secondary list extends the cell only
 * while the previous token carries a trailing comma ("§7 §3, §6").
 */
function splitPairs(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; ) {
    const cell = [tokens[i++]];
    if (i < tokens.length) cell.push(tokens[i++]);
    while (i < tokens.length && cell[cell.length - 1].endsWith(',')) cell.push(tokens[i++]);
    out.push(cell);
  }
  return out;
}

/** Logic cells are comma-separated internally and space-separated between. */
function splitRun(tokens) {
  const out = [];
  let cur = [];
  for (const t of tokens) {
    if (cur.length && !cur[cur.length - 1].endsWith(',')) {
      out.push(cur);
      cur = [];
    }
    cur.push(t);
  }
  if (cur.length) out.push(cur);
  return out;
}

const cats = cell => cell.join(' ').replace(/,/g, '').match(/§\d+/g) ?? [];
const logics = cell => cell.join(' ').replace(/,/g, '').match(/L\d+/g) ?? [];

const rows = new Map(); // number -> { name, primary, secondary[], logics[] }

function record(num, name, catCell, logicCell) {
  const c = cats(catCell);
  rows.set(num, {
    name,
    primary: c[0] ?? null,
    secondary: c.slice(1),
    logics: logics(logicCell),
  });
}

// ---------- page 23: left rows 1–44, right rows 58–101 ----------
{
  const L = page(23);
  const start = L.findIndex(l => l === '# Surah');
  const body = L.slice(start + 1);

  // Block 1: the left column's numbers and names, until the right column header.
  const hdr = body.findIndex(l => l === 'A Secondary');
  const leftNames = [];
  for (let i = 0; i < hdr; i++) {
    const m = body[i].match(/^(\d+)\s*(.*)$/);
    if (!m) continue;
    if (m[2]) leftNames.push([+m[1], m[2]]);
    else leftNames.push([+m[1], body[++i]]);
  }

  // Block 2: repeating [left A-cell, left logics-cell, right number, right name].
  const rest = body.slice(hdr + 1).filter(l => l !== 'Logics' && l !== '#' && l !== 'Surah');
  const rightNames = [];
  let li = 0;
  let i = 0;
  for (; i + 3 < rest.length && li < leftNames.length; i += 4) {
    const [num, name] = leftNames[li++];
    record(num, name, [rest[i]], [rest[i + 1]]);
    rightNames.push([+rest[i + 2], rest[i + 3]]);
  }

  // Block 3: the right column's data, as two runs.
  // "A Secondary" and "Logics" also appear as bare headers, and the logics
  // legend repeats every L-code — so take the line densest in real cells.
  const densest = (lines, re) =>
    lines
      .map(l => [l, (l.match(re) ?? []).length])
      .sort((a, b) => b[1] - a[1])[0][0];
  const aRun = densest(rest, /§\d+/g);
  const lRun = densest(rest.filter(l => !l.includes('recompense-in-kind')), /L\d+/g);
  const aCells = splitPairs(aRun.replace(/^A Secondary\s*/, '').split(/\s+/));
  const lCells = splitRun(lRun.replace(/^Logics\s*/, '').split(/\s+/));
  rightNames.forEach(([num, name], k) => record(num, name, aCells[k] ?? [], lCells[k] ?? []));
}

// ---------- page 24: left rows 45–57, right rows 102–114 ----------
{
  const L = page(24);
  const end = L.findIndex(l => l.startsWith('What the distribution'));
  const body = L.slice(0, end === -1 ? L.length : end);

  // Left: one line of "45 Name 46 Name …", then its A run, then its logics run.
  const leftLine = body[0];
  const leftNames = [...leftLine.matchAll(/(\d+)\s+([^\d]+?)(?=\s+\d+\s|$)/g)].map(m => [+m[1], m[2].trim()]);
  const leftA = splitPairs(body[1].split(/\s+/));
  const leftL = splitRun(body[2].split(/\s+/));
  leftNames.forEach(([num, name], k) => record(num, name, leftA[k] ?? [], leftL[k] ?? []));

  // Right: a line of numbers, a line of names, then the two runs.
  const nums = body[3].split(/\s+/);
  const names = body[4].split(/\s+/);
  const rightA = splitPairs(body[5].split(/\s+/));
  const rightL = splitRun(body[6].split(/\s+/));
  nums.forEach((n, k) => {
    // "113–4 Mu'awwidhatayn" tags the two surahs of refuge as one row.
    const span = n.includes('–') ? [113, 114] : [parseInt(n)];
    const proper = { 113: 'Al-Falaq', 114: 'An-Nas' };
    for (const num of span) {
      record(num, proper[num] ?? names[k], rightA[k] ?? [], rightL[k] ?? []);
      if (span.length > 1) rows.get(num).sharedRowWith = span.filter(x => x !== num);
    }
  });
}

// ---------- validate ----------
const missing = [];
const bad = [];
for (let n = 1; n <= 114; n++) {
  const r = rows.get(n);
  if (!r) { missing.push(n); continue; }
  if (!r.primary || !r.name) bad.push(`${n} ${r?.name ?? '?'}`);
}
console.log(`parsed ${rows.size} surahs`);
if (missing.length) console.log('MISSING:', missing.join(', '));
if (bad.length) console.log('INCOMPLETE:', bad.join(' | '));

const freq = {};
for (const r of rows.values()) for (const l of r.logics) freq[l] = (freq[l] ?? 0) + 1;
const top = Object.entries(freq).sort((a, b) => b[1] - a[1]);
console.log('logic frequency:', top.map(([k, v]) => `${k}:${v}`).join(' '));

const catFreq = {};
for (const r of rows.values()) catFreq[r.primary] = (catFreq[r.primary] ?? 0) + 1;
console.log('primary category:', Object.entries(catFreq).sort().map(([k, v]) => `${k}:${v}`).join(' '));

if (!missing.length && !bad.length) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const obj = {};
  for (const [n, r] of [...rows].sort((a, b) => a[0] - b[0])) obj[n] = r;
  fs.writeFileSync(OUT, JSON.stringify(obj, null, 1), 'utf8');
  console.log(`wrote ${OUT}`);
} else {
  console.log('NOT WRITTEN — fix the parse first');
  process.exitCode = 1;
}
