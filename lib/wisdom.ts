// Loader for content/wisdom — quotes, lessons and stories, one folder per type.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

const DIR = path.join(process.cwd(), 'content', 'wisdom');
const md = new Marked({ gfm: true });

export type WisdomType = 'quote' | 'lesson' | 'story' | 'poem';
export const TYPES: { key: WisdomType; label: string; blurb: string }[] = [
  { key: 'lesson', label: 'Lessons', blurb: 'The recurring logics — the patterns the Book argues by, not just the topics it covers.' },
  { key: 'story', label: 'Stories', blurb: 'Moments from the seerah that carry more than their length.' },
  { key: 'quote', label: 'Quotes', blurb: 'Lines worth keeping within reach.' },
  { key: 'poem', label: 'Poems', blurb: 'Written over twenty years, and the source of this site’s name.' },
];

export type AyahRef = { surah: number; from: number; to: number };

export type WisdomItem = {
  type: WisdomType;
  slug: string;
  title: string;
  attribution: string;
  logic: string | null;
  themes: string[];
  relatedAyahs: AyahRef[];
  relatedAyahLabels: string[];
  seerah: string[];
  html: string;
  favourite: boolean;
};

function parseAyahRef(s: string): AyahRef | null {
  const m = String(s).trim().match(/^(\d{1,3}):(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?$/);
  if (!m) return null;
  const surah = +m[1];
  if (surah < 1 || surah > 114) return null;
  const from = +m[2];
  return { surah, from, to: Math.max(from, m[3] ? +m[3] : from) };
}

function parse(type: WisdomType, file: string): WisdomItem {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, type, file), 'utf8'));
  const labels: string[] = Array.isArray(data.related_ayahs) ? data.related_ayahs.map(String) : [];
  return {
    type,
    slug: String(data.slug ?? file.replace(/\.md$/, '')),
    title: String(data.title ?? ''),
    attribution: String(data.attribution ?? ''),
    logic: data.logic ? String(data.logic) : null,
    themes: Array.isArray(data.themes) ? data.themes.map(String) : [],
    relatedAyahs: labels.map(parseAyahRef).filter((x): x is AyahRef => !!x),
    relatedAyahLabels: labels,
    seerah: Array.isArray(data.seerah) ? data.seerah.map(String) : [],
    html: md.parse(content.trim()) as string,
    favourite: data.favourite !== false,
  };
}

let cache: WisdomItem[] | null = null;

export function allWisdom(): WisdomItem[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  const out: WisdomItem[] = [];
  for (const { key } of TYPES) {
    const dir = path.join(DIR, key);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
      out.push(parse(key, f));
    }
  }
  // Lessons carrying a logic tag (L1…L12) keep the synthesis order.
  return (cache = out.sort((a, b) => {
    const ai = a.logic ? parseInt(a.logic.slice(1)) : 99;
    const bi = b.logic ? parseInt(b.logic.slice(1)) : 99;
    if (a.type === b.type && a.type === 'lesson') return ai - bi;
    return 0;
  }));
}

export function wisdomThemes(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const w of allWisdom()) for (const t of w.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export function wisdomForAyah(surah: number, ayah: number): WisdomItem[] {
  return allWisdom().filter(w =>
    w.relatedAyahs.some(r => r.surah === surah && r.from <= ayah && r.to >= ayah)
  );
}
