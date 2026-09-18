// Builds data/search-index.json — everything on the site, in one file that the
// search route reads server-side. Committed, so a deploy needs no network and
// no database.
//
//   node scripts/build-search-index.mjs
//
// Rows are compact arrays rather than objects; at ~6,700 entries the key names
// would otherwise be most of the file.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import zlib from 'node:zlib';

const QF = 'https://api.quran.com/api/v4';
const AQ = 'https://api.alquran.cloud/v1';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'search-index.json.gz');
// Committed, so the index can be rebuilt on every deploy without network access.
const QCACHE = path.join(ROOT, 'data', 'quran-source.json.gz');

const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);

/** Strip diacritics so Arabic searches match regardless of vowel marks. */
function bareArabic(s) {
  return s
    .replace(/[ـ]/g, '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const stripMd = s =>
  s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, m => m.replace(/\|/g, ' '))
    .replace(/[#*_`>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------- Qur'an text ----------

async function quranRows() {
  if (exists(QCACHE)) return JSON.parse(zlib.gunzipSync(fs.readFileSync(QCACHE)).toString('utf8'));
  console.log('no cached Quran source — fetching it once');
  const rows = [];
  for (let n = 1; n <= 114; n++) {
    const [vRes, tRes] = await Promise.all([
      fetch(`${QF}/verses/by_chapter/${n}?fields=text_uthmani&per_page=300`),
      fetch(`${AQ}/surah/${n}/en.sahih`),
    ]);
    const v = await vRes.json();
    const t = await tRes.json();
    const en = {};
    for (const a of t.data?.ayahs || []) en[a.numberInSurah] = a.text;
    for (const x of v.verses || []) {
      rows.push([n, x.verse_number, x.text_uthmani || '', en[x.verse_number] || '']);
    }
    process.stdout.write(n % 10 === 0 ? String(n) : '.');
  }
  console.log(`\nfetched ${rows.length} ayahs`);
  fs.mkdirSync(path.dirname(QCACHE), { recursive: true });
  fs.writeFileSync(QCACHE, zlib.gzipSync(JSON.stringify(rows), { level: 9 }));
  return rows;
}

// ---------- content folders ----------

function dirEntries(rel, map, pattern = /\.md$/) {
  const dir = path.join(ROOT, rel);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => pattern.test(f))
    .sort()
    .map(f => {
      const { data, content } = matter(read(path.join(dir, f)));
      return map(data, stripMd(content), f);
    })
    .filter(Boolean);
}

const rows = [];
// [kind, id, title, body, url, surah, ayah, arabic]
const push = (kind, id, title, body, url, surah = 0, ayah = 0, arabic = '') =>
  rows.push([kind, id, title, body, url, surah, ayah, arabic]);

// Qur'an
for (const [s, a, ar, en] of await quranRows()) {
  push('ayah', `ayah:${s}:${a}`, `${s}:${a}`, en, `/quran/${s}/${a}`, s, a, bareArabic(ar));
}

// Tafsir notes — one row per note, keeping the whole body searchable
dirEntries('content/tafsir', (d, body, f) => {
  const surahs = Array.isArray(d.surahs) ? d.surahs.map(Number) : [Number(d.surah)];
  const s = surahs[0] || 0;
  push('tafsir', `tafsir:${f}`, String(d.title || d.name || f), body, `/tafsir/${s}`, s);
}, /^\d{3}.*\.md$/);

// Seerah
dirEntries('content/seerah', (d, body) => {
  push('seerah', `seerah:${d.slug}`, String(d.title || ''), `${d.snippet || ''} ${body}`, `/seerah/${d.slug}`);
}, /^\d{3}.*\.md$/);

// Names of Allah
dirEntries('content/names', (d, body) => {
  const extra = [d.transliteration, d.meaning_short, (d.meanings || []).join(' '), d.invocation].join(' ');
  push('name', `name:${d.slug}`, `${d.transliteration} — ${d.meaning_short}`, `${extra} ${body}`,
    `/names/${d.slug}`, 0, 0, bareArabic(String(d.arabic || '')));
}, /^\d{2}-.*\.md$/);

// Duas
dirEntries('content/duas', (d, body) => {
  const extra = [d.translation, d.transliteration, d.reference, (d.occasion || []).join(' ')].join(' ');
  push('dua', `dua:${d.slug}`, String(d.title || ''), `${extra} ${body}`,
    `/duas#${d.slug}`, Number(d.surah || 0), Number(d.ayah_from || 0), bareArabic(String(d.arabic || '')));
});

// Wisdom — nested one folder per type
for (const type of ['lesson', 'story', 'quote']) {
  dirEntries(`content/wisdom/${type}`, (d, body) => {
    push('wisdom', `wisdom:${type}:${d.slug}`, String(d.title || ''),
      `${d.attribution || ''} ${(d.themes || []).join(' ')} ${body}`, `/wisdom#${d.slug}`);
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
// Gzipped: 4.4 MB of JSON becomes about a third of that in the repo and the bundle.
fs.writeFileSync(OUT, zlib.gzipSync(JSON.stringify({ built: new Date().toISOString(), rows }), { level: 9 }));

const counts = rows.reduce((m, r) => ({ ...m, [r[0]]: (m[r[0]] || 0) + 1 }), {});
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`\nwrote ${rows.length} rows (${mb} MB) to data/search-index.json.gz`);
console.log(Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`).join('\n'));
