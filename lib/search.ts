// Server-side search over the index built by scripts/build-search-index.mjs.
// The index ships inside the deployment, so a query costs no network call and
// no database round-trip.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const FILE = path.join(process.cwd(), 'data', 'search-index.json.gz');

export type Kind = 'ayah' | 'tafsir' | 'seerah' | 'name' | 'dua' | 'wisdom';

export const KINDS: { key: Kind; label: string }[] = [
  { key: 'ayah', label: 'Quran' },
  { key: 'tafsir', label: 'Tafsir notes' },
  { key: 'seerah', label: 'Seerah' },
  { key: 'name', label: 'Names of Allah' },
  { key: 'dua', label: 'Duas' },
  { key: 'wisdom', label: 'Wisdom' },
];

// [kind, id, title, body, url, surah, ayah, arabic]
type Row = [Kind, string, string, string, string, number, number, string];

export type Hit = {
  kind: Kind;
  id: string;
  title: string;
  url: string;
  surah: number;
  ayah: number;
  snippet: string;
  score: number;
};

let index: { rows: Row[]; lower: string[]; titles: string[] } | null = null;

function load() {
  if (index) return index;
  if (!fs.existsSync(FILE)) {
    index = { rows: [], lower: [], titles: [] };
    return index;
  }
  const { rows } = JSON.parse(zlib.gunzipSync(fs.readFileSync(FILE)).toString('utf8')) as { rows: Row[] };
  // Lower-cased haystacks are precomputed once; doing it per query over 6,500
  // rows is what makes a naive scan feel slow.
  index = {
    rows,
    lower: rows.map(r => `${r[3]} ${r[7]}`.toLowerCase()),
    titles: rows.map(r => r[2].toLowerCase()),
  };
  return index;
}

/** Same normalisation the index builder applies to Arabic. */
function normalise(q: string): string {
  return q
    .replace(/[ـ]/g, '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

function snippet(body: string, term: string): string {
  const i = body.toLowerCase().indexOf(term);
  if (i < 0) return body.slice(0, 180) + (body.length > 180 ? '…' : '');
  const start = Math.max(0, i - 70);
  const end = Math.min(body.length, i + term.length + 110);
  return (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
}

export type SearchResult = {
  query: string;
  total: number;
  counts: Record<string, number>;
  hits: Hit[];
};

export function search(query: string, opts: { kind?: Kind | null; limit?: number } = {}): SearchResult {
  const { rows, lower, titles } = load();
  const q = normalise(query);
  const terms = q.split(/\s+/).filter(t => t.length > 1);
  const empty = { query, total: 0, counts: {}, hits: [] };
  if (!terms.length) return empty;

  const limit = opts.limit ?? 40;
  const scored: Hit[] = [];
  const counts: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const hay = lower[i];
    const title = titles[i];

    // Every term must appear somewhere, so multi-word queries narrow rather than widen.
    let score = 0;
    let ok = true;
    for (const t of terms) {
      const inTitle = title.includes(t);
      const inBody = hay.includes(t);
      if (!inTitle && !inBody) { ok = false; break; }
      if (inTitle) score += 6;
      if (inBody) score += 1;
    }
    if (!ok) continue;

    // A contiguous match of the whole phrase beats scattered terms.
    if (terms.length > 1 && hay.includes(q)) score += 5;

    const r = rows[i];
    counts[r[0]] = (counts[r[0]] ?? 0) + 1;
    if (opts.kind && r[0] !== opts.kind) continue;

    scored.push({
      kind: r[0],
      id: r[1],
      title: r[2],
      url: r[4],
      surah: r[5],
      ayah: r[6],
      snippet: snippet(r[3], terms[0]),
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind));
  const total = Object.values(counts).reduce((n, c) => n + c, 0);
  return { query, total, counts, hits: scored.slice(0, limit) };
}
