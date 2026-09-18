// Loader for content/names — the ninety-nine names.
// `quran_occurrences` is derived by scripts/build-name-occurrences.mjs from the
// Uthmani text, so the references are found rather than recalled.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

const DIR = path.join(process.cwd(), 'content', 'names');
const md = new Marked({ gfm: true });

export type AyahRef = { surah: number; ayah: number };

export type DivineName = {
  number: number;
  slug: string;
  arabic: string;
  transliteration: string;
  meaningShort: string;
  meanings: string[];
  root: string;
  invocation: string;
  themes: string[];
  occurrences: AyahRef[];
  occurrenceKeys: string[];
  verbatimInQuran: boolean;
  html: string;
};

function parseKey(s: string): AyahRef | null {
  const m = String(s).match(/^(\d{1,3}):(\d{1,3})$/);
  if (!m) return null;
  return { surah: +m[1], ayah: +m[2] };
}

function parse(file: string): DivineName {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const keys: string[] = Array.isArray(data.quran_occurrences) ? data.quran_occurrences.map(String) : [];
  return {
    number: Number(data.number ?? 0),
    slug: String(data.slug ?? file.replace(/^\d+-|\.md$/g, '')),
    arabic: String(data.arabic ?? ''),
    transliteration: String(data.transliteration ?? ''),
    meaningShort: String(data.meaning_short ?? ''),
    meanings: Array.isArray(data.meanings) ? data.meanings.map(String) : [],
    root: String(data.root ?? ''),
    invocation: String(data.invocation ?? ''),
    themes: Array.isArray(data.themes) ? data.themes.map(String) : [],
    occurrences: keys.map(parseKey).filter((x): x is AyahRef => !!x),
    occurrenceKeys: keys,
    verbatimInQuran: data.verbatim_in_quran === true,
    html: md.parse(content.trim()) as string,
  };
}

let cache: DivineName[] | null = null;

export function allNames(): DivineName[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  cache = fs
    .readdirSync(DIR)
    .filter(f => /^\d{2}-.*\.md$/.test(f))
    .map(parse)
    .sort((a, b) => a.number - b.number);
  return cache;
}

export function nameBySlug(slug: string): DivineName | null {
  return allNames().find(n => n.slug === slug) ?? null;
}

export function nameNeighbours(slug: string): { prev: DivineName | null; next: DivineName | null } {
  const all = allNames();
  const i = all.findIndex(n => n.slug === slug);
  return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

/** Names whose derived occurrences include this ayah. */
export function namesForAyah(surah: number, ayah: number): DivineName[] {
  return allNames().filter(n => n.occurrences.some(o => o.surah === surah && o.ayah === ayah));
}

export function nameThemes(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of allNames()) for (const t of n.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}
