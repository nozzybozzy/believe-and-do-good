// Fills `quran_occurrences` in content/names/*.md by searching the actual
// Uthmani text, rather than trusting a list from memory.
//
// It fetches all 114 surahs once, strips diacritics, and looks for each name as
// a whole word (or phrase), with and without the definite article. Anything it
// cannot find is reported: several of the ninety-nine are known from the hadith
// list rather than appearing verbatim in the Qur'an, and the script marks those
// honestly instead of inventing references.
//
//   node scripts/build-name-occurrences.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const QF = 'https://api.quran.com/api/v4';
const DIR = path.join(process.cwd(), 'content', 'names');
const CACHE = path.join(process.cwd(), 'reference', 'quran-uthmani.json');
const MAX = 12;

// The Uthmani script writes many long vowels with a dagger alef (U+0670) where
// ordinary spelling uses a full alef: al-Wāḥid is ٱلْوَٰحِدُ, not ٱلْوَاحِدُ. But
// ar-Raḥmān is ٱلرَّحْمَٰنِ against the ordinary ٱلرحمن. Neither "always expand" nor
// "always drop" works, so each ayah is tokenised both ways and both are searched.
function bare(s, daggerAsAlef) {
  return s
    .replace(/ـ/g, '')                                   // tatweel
    .replace(/ٰ/g, daggerAsAlef ? 'ا' : '')         // dagger alef
    .replace(/[ؐ-ًؚ-ٟۖ-ۭ]/g, '') // remaining marks
    .replace(/[آأإٱ]/g, 'ا')          // alef variants
    .replace(/ى/g, 'ي')                              // alef maqsura
    .trim();
}

const words = (s, dagger = true) =>
  bare(s, dagger).split(/\s+/).map(w => w.replace(/[^ء-ي]/g, '')).filter(Boolean);

async function loadQuran() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = [];
  for (let n = 1; n <= 114; n++) {
    const r = await fetch(`${QF}/verses/by_chapter/${n}?fields=text_uthmani&per_page=300`);
    const j = await r.json();
    for (const v of j.verses || []) out.push([v.verse_key, v.text_uthmani || '']);
    process.stdout.write(n % 10 === 0 ? String(n) : '.');
  }
  console.log(`\nfetched ${out.length} ayahs`);
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(out), 'utf8');
  return out;
}

const quran = await loadQuran();
// Pre-tokenise once, both ways; 6236 ayahs x 99 names is otherwise needlessly slow.
const tokenised = quran.map(([key, text]) => [key, words(text, true), words(text, false)]);

// Arabic glues conjunctions and prepositions onto the front of a word, so
// وَٱلْبَاطِنُ is al-Bāṭin with a wa- attached. Since every name here begins with
// the definite article, allowing a prefix is safe.
const hit = (w, n) => w === n || w.endsWith(n);

function matches(ws, n) {
  for (let i = 0; i + n.length <= ws.length; i++) {
    if (!hit(ws[i], n[0])) continue;
    let ok = true;
    for (let j = 1; j < n.length; j++) if (ws[i + j] !== n[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

/** Whole-word (or consecutive-phrase) match against either tokenisation. */
function find(needle) {
  const n = words(needle);
  if (!n.length) return [];
  const hits = [];
  for (const [key, expanded, dropped] of tokenised) {
    if (matches(expanded, n) || matches(dropped, n)) hits.push(key);
    if (hits.length >= MAX) break;
  }
  return hits;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md')).sort();
const notFound = [];
let filled = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  const { data, content } = matter(raw);
  const arabic = String(data.arabic ?? '');

  // Try the name as written; then in its pausal spelling, where a final weak
  // ya is dropped (al-Mutaʿālī is written ٱلْمُتَعَالِ in 13:9); then without
  // the definite article.
  const tries = [arabic, arabic.replace(/ي\s*$/, ''), arabic.replace(/^\s*ال/, '')];
  let hits = [];
  for (const t of tries) {
    hits = find(t);
    if (hits.length) break;
  }

  data.quran_occurrences = hits;
  data.verbatim_in_quran = hits.length > 0;
  if (!hits.length) notFound.push(`${data.number} ${data.transliteration}`);
  else filled++;

  fs.writeFileSync(path.join(DIR, f), matter.stringify(content, data), 'utf8');
}

console.log(`\n${filled} names matched in the Uthmani text; ${notFound.length} not found verbatim:`);
notFound.forEach(n => console.log('  -', n));
