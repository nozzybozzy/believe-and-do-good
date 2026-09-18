// Loader for the seerah entries in content/seerah.
// Server-only: reads the filesystem at build time.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

const DIR = path.join(process.cwd(), 'content', 'seerah');
const md = new Marked({ gfm: true });

export type Period = 'pre-prophethood' | 'meccan' | 'medinan' | 'final-years';

export const PERIODS: { key: Period; label: string; blurb: string }[] = [
  { key: 'pre-prophethood', label: 'Before Prophethood', blurb: 'Birth to the eve of the first revelation — 571 to 610 CE.' },
  { key: 'meccan', label: 'Makkah', blurb: 'From the cave of Hira to the night of the Hijrah — thirteen years.' },
  { key: 'medinan', label: 'Madinah', blurb: 'Building a community, and defending it — years 1 to 7 after the Hijrah.' },
  { key: 'final-years', label: 'The Final Years', blurb: 'From the conquest of Makkah to the Farewell Pilgrimage and the passing.' },
];

export type AyahRef = { surah: number; from: number; to: number };

export type SeerahEntry = {
  file: string;
  order: number;
  slug: string;
  title: string;
  period: Period;
  yearCe: number | null;
  yearHijri: number | null;
  tags: string[];
  relatedAyahs: AyahRef[];
  relatedAyahLabels: string[];
  sources: string[];
  snippet: string;
  html: string;
  words: number;
};

/** "105:1-5" | "17:1" | "2:142-150" */
function parseAyahRef(s: string): AyahRef | null {
  const m = String(s).trim().match(/^(\d{1,3}):(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?$/);
  if (!m) return null;
  const surah = +m[1];
  if (surah < 1 || surah > 114) return null;
  const from = +m[2];
  const to = m[3] ? +m[3] : from;
  return { surah, from, to: Math.max(from, to) };
}

function parseEntry(file: string): SeerahEntry {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const labels: string[] = Array.isArray(data.related_ayahs) ? data.related_ayahs.map(String) : [];
  return {
    file,
    order: Number(data.order ?? 0),
    slug: String(data.slug ?? file.replace(/^\d+-|\.md$/g, '')),
    title: String(data.title ?? ''),
    period: (String(data.period ?? 'meccan') as Period),
    yearCe: data.year_ce == null ? null : Number(data.year_ce),
    yearHijri: data.year_hijri == null ? null : Number(data.year_hijri),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    relatedAyahs: labels.map(parseAyahRef).filter((x): x is AyahRef => !!x),
    relatedAyahLabels: labels,
    sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    snippet: String(data.snippet ?? ''),
    html: md.parse(content.trim()) as string,
    words: content.split(/\s+/).filter(Boolean).length,
  };
}

let cache: SeerahEntry[] | null = null;

export function allSeerah(): SeerahEntry[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  cache = fs
    .readdirSync(DIR)
    .filter(f => /^\d{3}.*\.md$/.test(f))
    .sort()
    .map(parseEntry)
    .sort((a, b) => a.order - b.order);
  return cache;
}

export function seerahBySlug(slug: string): SeerahEntry | null {
  return allSeerah().find(e => e.slug === slug) ?? null;
}

export function seerahByPeriod(): { key: Period; label: string; blurb: string; entries: SeerahEntry[] }[] {
  const all = allSeerah();
  return PERIODS.map(p => ({ ...p, entries: all.filter(e => e.period === p.key) }));
}

/** Neighbours in the timeline, for prev/next links. */
export function seerahNeighbours(slug: string): { prev: SeerahEntry | null; next: SeerahEntry | null } {
  const all = allSeerah();
  const i = all.findIndex(e => e.slug === slug);
  return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

/** Entries whose related_ayahs cover this ayah. */
export function seerahForAyah(surah: number, ayah: number): SeerahEntry[] {
  return allSeerah().filter(e =>
    e.relatedAyahs.some(r => r.surah === surah && r.from <= ayah && r.to >= ayah)
  );
}

/** Entries touching a surah at all, for the reader header. */
export function seerahForSurah(surah: number): SeerahEntry[] {
  return allSeerah().filter(e => e.relatedAyahs.some(r => r.surah === surah));
}

export type SeerahSnippetJson = {
  slug: string;
  title: string;
  snippet: string;
  ayah: string;
  period: Period;
  /** true on the ayah the linked range opens at, so the reader shows it once */
  first: boolean;
};

/** Per-ayah seerah snippets as plain JSON, keyed by ayah, for the player. */
export function seerahSnippetsJson(surah: number): Record<string, SeerahSnippetJson[]> {
  const out: Record<string, SeerahSnippetJson[]> = {};
  for (const e of seerahForSurah(surah)) {
    for (const r of e.relatedAyahs) {
      if (r.surah !== surah) continue;
      const label = r.from === r.to ? `${r.surah}:${r.from}` : `${r.surah}:${r.from}-${r.to}`;
      for (let a = r.from; a <= r.to; a++) {
        const list = (out[a] ??= []);
        if (!list.some(x => x.slug === e.slug)) {
          list.push({
            slug: e.slug,
            title: e.title,
            snippet: e.snippet,
            ayah: label,
            period: e.period,
            first: a === r.from,
          });
        }
      }
    }
  }
  return out;
}

export function seerahMinutes(e: SeerahEntry): number {
  return Math.max(1, Math.round(e.words / 230));
}
