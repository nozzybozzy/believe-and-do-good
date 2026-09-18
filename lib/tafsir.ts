// Loader for the owner's distilled Ibn Kathir notes in content/tafsir.
// Server-only: reads the filesystem at build time.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { surahMeta } from './surahs';

const DIR = path.join(process.cwd(), 'content', 'tafsir');
const md = new Marked({ gfm: true });

export type AyahRange = { surah: number; from: number; to: number };

export type TafsirSection = {
  id: string;
  heading: string; // plain text
  headingHtml: string;
  html: string;
  ranges: AyahRange[];
  kind: 'intro' | 'summary' | 'passage' | 'general';
  part?: number;
};

export type TafsirDoc = {
  file: string;
  surahs: number[];
  name: string;
  title: string;
  subtitle?: string;
  subtitleHtml?: string;
  part?: number;
  partLabel?: string;
  source?: string;
  words: number;
  preambleHtml: string;
  sections: TafsirSection[];
};

// ---------- ayah references in headings ----------

const DASH = '[–—-]';
const R_FULL = new RegExp(`\\b(\\d{1,3}):(\\d{1,3})[a-z]?(?:\\s*${DASH}\\s*(?:(\\d{1,3}):)?(\\d{1,3})[a-z]?)?`, 'g');
const R_WORD = new RegExp(`\\b(?:Ayat|Ayah|Ayahs|Verses?|vv?\\.)\\s+(\\d{1,3})(?:\\s*${DASH}\\s*(\\d{1,3}))?`, 'gi');
const R_PAREN = new RegExp(`\\((\\d{1,3})(?:\\s*${DASH}\\s*(\\d{1,3}))?\\)`, 'g');

function clampRange(surah: number, a: number, b: number, max: number): AyahRange | null {
  if (a < 1 || a > max) return null;
  const to = Math.min(Math.max(a, b), max);
  return { surah, from: a, to };
}

export function headingRefs(text: string, surahs: number[], maxFor: (s: number) => number): AyahRange[] {
  const out: AyahRange[] = [];
  for (const m of text.matchAll(R_FULL)) {
    const s = +m[1];
    if (!surahs.includes(s)) continue;
    const a = +m[2];
    let b = m[4] ? +m[4] : a;
    if (m[3] && +m[3] !== s) b = a;
    const r = clampRange(s, a, b, maxFor(s));
    if (r) out.push(r);
  }
  // Bare numbers are only unambiguous when the doc covers one surah
  if (out.length || surahs.length > 1) return out;
  const s = surahs[0];
  for (const re of [R_WORD, R_PAREN]) {
    for (const m of text.matchAll(re)) {
      const a = +m[1];
      const r = clampRange(s, a, m[2] ? +m[2] : a, maxFor(s));
      if (r) out.push(r);
    }
    if (out.length) break;
  }
  return out;
}

// When a heading names no ayat, fall back to the ayat the section itself
// cites from this surah, as long as they form a tight cluster.
function bodyRefs(body: string, surahs: number[], maxFor: (s: number) => number): AyahRange[] {
  if (surahs.length > 1) return [];
  const s = surahs[0];
  const nums: number[] = [];
  for (const m of body.matchAll(R_FULL)) {
    if (+m[1] !== s) continue;
    nums.push(+m[2]);
    if (m[4] && !m[3]) nums.push(+m[4]);
  }
  if (!nums.length) return [];
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  if (hi - lo > 12) return [];
  const r = clampRange(s, lo, hi, maxFor(s));
  return r ? [r] : [];
}

// ---------- helpers ----------

export function stripMd(s: string): string {
  return s.replace(/[*_`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').trim();
}

function slug(s: string): string {
  return stripMd(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section';
}

const INTRO = /^(0\.\s*)?(What This Surah Is Doing|The Shape of the Surah|How to Read This Surah)/i;
const SUMMARY = /^(\d+\.\s*)?(If You Remember Nothing Else|The Thread|The Takeaway|In One Breath|What to Carry Away|The (Whole )?Surah in One Line)/i;

// ---------- parsing ----------

const maxFor = (s: number) => surahMeta(s)?.ayat ?? 300;

// Manual ayah ranges for sections whose headings don't carry them
type AyahMap = Record<string, Record<string, string>>;
let ayahMap: AyahMap | null = null;
function overrides(file: string): Record<string, string> {
  if (!ayahMap) {
    const p = path.join(DIR, '_ayah-map.json');
    ayahMap = fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')) as AyahMap) : {};
  }
  return ayahMap[file] ?? {};
}

function parseRange(surah: number, v: string): AyahRange | null {
  const m = v.match(/^(\d+)(?:\s*[–—-]\s*(\d+))?$/);
  return m ? clampRange(surah, +m[1], m[2] ? +m[2] : +m[1], maxFor(surah)) : null;
}

function parseDoc(file: string): TafsirDoc {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  const { data, content } = matter(raw);
  const surahs: number[] = Array.isArray(data.surahs) ? data.surahs.map(Number) : [Number(data.surah)];
  const part: number | undefined = data.part ? Number(data.part) : undefined;
  const prefix = part ? `p${part}-` : '';

  const lines = content.split('\n');
  const chunks: { heading: string | null; body: string[] }[] = [{ heading: null, body: [] }];
  let inFence = false;
  for (const ln of lines) {
    if (/^```/.test(ln)) inFence = !inFence;
    const h = !inFence && ln.match(/^##\s+(.+?)\s*$/);
    if (h) chunks.push({ heading: h[1], body: [] });
    else chunks[chunks.length - 1].body.push(ln);
  }

  const manual = overrides(file);
  const used = new Set<string>();
  const sections: TafsirSection[] = [];
  for (const c of chunks.slice(1)) {
    const heading = stripMd(c.heading!);
    const num = heading.match(/^(\d+)\./)?.[1];
    const base = slug(heading.replace(/^\d+\.\s*/, '').replace(/\([^)]*\d[^)]*\)/g, ''));
    let id = prefix + base;
    let k = 2;
    while (used.has(id)) id = `${prefix}${base}-${k++}`;
    used.add(id);
    const body = c.body.join('\n').replace(/\n\s*-{3,}\s*$/, '').replace(/\s+$/, '');
    let kind: TafsirSection['kind'] = 'general';
    let ranges: AyahRange[] = [];
    if (INTRO.test(heading)) kind = 'intro';
    else if (SUMMARY.test(heading)) kind = 'summary';
    else if (num && manual[num] && surahs.length === 1) {
      const r = parseRange(surahs[0], manual[num]);
      if (r) { ranges = [r]; kind = 'passage'; }
    } else {
      ranges = headingRefs(heading, surahs, maxFor);
      if (!ranges.length) ranges = bodyRefs(body, surahs, maxFor);
      if (ranges.length) kind = 'passage';
    }
    sections.push({
      id,
      heading,
      headingHtml: md.parseInline(c.heading!) as string,
      html: md.parse(body) as string,
      ranges,
      kind,
      part,
    });
  }

  // Drop the leading subtitle line and horizontal rules from the preamble
  const pre = chunks[0].body.join('\n').trim().split('\n').filter((l, i) => !(i === 0 && /^\*.*\*$/.test(l.trim()))).join('\n');
  const preamble = pre.replace(/^\s*-{3,}\s*$/gm, '').trim();

  return {
    file,
    surahs,
    name: String(data.name ?? ''),
    title: String(data.title ?? data.name ?? ''),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    subtitleHtml: data.subtitle ? (md.parseInline(String(data.subtitle)) as string) : undefined,
    part,
    partLabel: data.part_label ? String(data.part_label) : undefined,
    source: data.source ? String(data.source) : undefined,
    words: content.split(/\s+/).filter(Boolean).length,
    preambleHtml: preamble ? (md.parse(preamble) as string) : '',
    sections,
  };
}

let cache: TafsirDoc[] | null = null;

export function allTafsir(): TafsirDoc[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  cache = fs
    .readdirSync(DIR)
    .filter(f => /^\d{3}.*\.md$/.test(f))
    .sort()
    .map(parseDoc);
  return cache;
}

/** Docs covering a surah, in part order (Al-Baqarah has two). */
export function tafsirFor(surah: number): TafsirDoc[] {
  return allTafsir()
    .filter(d => d.surahs.includes(surah))
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
}

export function surahsWithTafsir(): Set<number> {
  return new Set(allTafsir().flatMap(d => d.surahs));
}

export type AyahNote = { section: TafsirSection; first: boolean };

/** For the reader: which note sections cover each ayah of a surah. */
export function notesByAyah(surah: number): Map<number, AyahNote[]> {
  const map = new Map<number, AyahNote[]>();
  for (const d of tafsirFor(surah)) {
    for (const s of d.sections) {
      for (const r of s.ranges) {
        if (r.surah !== surah) continue;
        for (let a = r.from; a <= r.to; a++) {
          const list = map.get(a) ?? [];
          if (!list.some(x => x.section.id === s.id)) list.push({ section: s, first: a === r.from });
          map.set(a, list);
        }
      }
    }
  }
  return map;
}

export function readingMinutes(docs: TafsirDoc[]): number {
  return Math.max(1, Math.round(docs.reduce((n, d) => n + d.words, 0) / 230));
}

// ---------- serialisable views for client components ----------

export type NoteSectionJson = {
  id: string;
  heading: string;
  headingHtml: string;
  html: string;
};

export type AyahNoteRef = { id: string; from: number; to: number; first: boolean };

export type NotesIndex = {
  sections: Record<string, NoteSectionJson>;
  byAyah: Record<string, AyahNoteRef[]>;
};

const dropNum = (s: string) => s.replace(/^\d+\.\s*/, '');

/**
 * Per-ayah notes as plain JSON, for the player's Learn-more panel.
 *
 * Sections are listed once and referenced by id: a section covering forty ayat
 * would otherwise be serialised forty times, which took Al-Baqarah's payload
 * past 4 MB. `first` marks the ayah a section opens at.
 */
export function ayahNotesJson(surah: number): NotesIndex {
  const sections: Record<string, NoteSectionJson> = {};
  const byAyah: Record<string, AyahNoteRef[]> = {};

  for (const [ayah, list] of notesByAyah(surah)) {
    byAyah[ayah] = list.map(({ section: s, first }) => {
      if (!sections[s.id]) {
        sections[s.id] = {
          id: s.id,
          heading: dropNum(s.heading),
          headingHtml: dropNum(s.headingHtml),
          html: s.html,
        };
      }
      const r = s.ranges.find(x => x.surah === surah && x.from <= ayah && x.to >= ayah)!;
      return { id: s.id, from: r.from, to: r.to, first };
    });
  }

  return { sections, byAyah };
}

/** The one section that covers an ayah, preferring the one that opens at it. */
export function sectionForAyah(surah: number, ayah: number): TafsirSection | null {
  const list = notesByAyah(surah).get(ayah) ?? [];
  return (list.find(x => x.first) ?? list[0])?.section ?? null;
}
