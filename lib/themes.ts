// The owner's own framework from the Core Themes synthesis: eight categories
// and fourteen recurring logics, with every surah tagged against them.
// data/surah-themes.json is parsed out of the PDF by scripts/parse-core-themes-index.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { surahMeta } from './surahs';

const FILE = path.join(process.cwd(), 'data', 'surah-themes.json');

export type Category = { key: string; title: string; subtitle: string; blurb: string };
export type Logic = { key: string; slug: string; title: string; gist: string };

/** §0–§7, the eight working categories of Part One. */
export const CATEGORIES: Category[] = [
  { key: '§0', title: 'The Book and the One Who Reads It', subtitle: 'Tanzil, tadabbur, and the ethics of reception',
    blurb: 'The only category whose subject is the Qur’an’s own act of speaking: what this is, and how you are meant to receive it.' },
  { key: '§1', title: 'The One', subtitle: 'Tawhid, the names, and the sole right to be worshipped',
    blurb: 'The Book’s first subject and its non-negotiable centre. Everything else is downstream.' },
  { key: '§2', title: 'The Signs', subtitle: 'Creation, provision, history, and the argument from evidence',
    blurb: 'Not primarily proofs that God exists — the signs argue for resurrection, and for gratitude.' },
  { key: '§3', title: 'The Unseen', subtitle: 'Angels, jinn, revelation, and the decree',
    blurb: 'What is real but not visible, and what follows from accepting that it is real.' },
  { key: '§4', title: 'The Messengers and the Nations', subtitle: 'Risalah, qisas, and the seerah as live case',
    blurb: 'One argument told seven times, with the ending always the same.' },
  { key: '§5', title: 'The Heart', subtitle: 'Tazkiyah — the moral psychology of the human being',
    blurb: 'The inner law: what goes wrong inside a person, named precisely and diagnosed.' },
  { key: '§6', title: 'The Law and the Just Order', subtitle: 'Shari’ah, akhlaq, and the shape of a community',
    blurb: 'The outer law — almost entirely Madinan, and almost absent before it.' },
  { key: '§7', title: 'The Return', subtitle: 'Death, resurrection, the reckoning, and the two abodes',
    blurb: 'Where this is going, which is what the most recited section of the Qur’an is overwhelmingly about.' },
];

/** L1–L14, the recurring logics of Part Two. */
export const LOGICS: Logic[] = [
  { key: 'L1', slug: 'recompense-in-kind', title: 'Recompense in kind', gist: 'The deed comes back in its own currency.' },
  { key: 'L2', slug: 'the-powerless-test', title: 'The powerless test', gist: 'Creed is proved by conduct toward those who cannot reciprocate.' },
  { key: 'L3', slug: 'the-smallest-unit', title: 'The smallest unit', gist: 'You are measured where generosity costs nothing.' },
  { key: 'L4', slug: 'the-inversion-of-scales', title: 'Inversion of scales', gist: 'Every worldly measure is picked up and reversed.' },
  { key: 'L5', slug: 'success-is-a-summons', title: 'Success as summons', gist: 'Relief is never a place to stop.' },
  { key: 'L6', slug: 'the-order-is-the-teaching', title: 'The ordering', gist: 'Where the Book looks repetitive, the argument is in the order.' },
  { key: 'L7', slug: 'mercy-calibrated-to-capacity', title: 'Capacity and mercy', gist: 'Commands are scaled to capacity; prohibitions are not.' },
  { key: 'L8', slug: 'paired-opposites', title: 'Paired opposites', gist: 'The Book sorts by what you did once the evidence arrived.' },
  { key: 'L9', slug: 'the-enemy-is-a-whisper', title: 'The whisper', gist: 'Not a power — a suggestion, and its reduction is the proof of its defeat.' },
  { key: 'L10', slug: 'accountability-is-evidentiary', title: 'Evidentiary judgement', gist: 'Nothing is asserted without being demonstrated.' },
  { key: 'L11', slug: 'ingratitude-is-the-root-diagnosis', title: 'Ingratitude', gist: 'Counting the calamities and forgetting the favours.' },
  { key: 'L12', slug: 'truth-carrying-attracts-harm', title: 'The cost of truth', gist: 'The Book budgets in advance for what carrying it will cost.' },
  { key: 'L13', slug: 'jurisdiction', title: 'Jurisdiction', gist: 'Do your part, and leave His to Him.' },
  { key: 'L14', slug: 'circumstance-carries-no-verdict', title: 'Circumstance carries no verdict', gist: 'The variable is never the circumstance. It is the response.' },
];

export const categoryByKey = (k: string) => CATEGORIES.find(c => c.key === k) ?? null;
export const logicByKey = (k: string) => LOGICS.find(l => l.key === k) ?? null;
export const logicBySlug = (s: string) => LOGICS.find(l => l.slug === s) ?? null;

export type SurahTheme = {
  surah: number;
  name: string;
  primary: string;
  secondary: string[];
  logics: string[];
  /** 113 and 114 are tagged as one row in the source table. */
  sharedRowWith?: number[];
};

let cache: SurahTheme[] | null = null;

export function allSurahThemes(): SurahTheme[] {
  if (cache) return cache;
  if (!fs.existsSync(FILE)) return (cache = []);
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Record<string, Omit<SurahTheme, 'surah'>>;
  cache = Object.entries(raw)
    .map(([n, r]) => ({ surah: +n, ...r }))
    .sort((a, b) => a.surah - b.surah);
  return cache;
}

export function themeFor(surah: number): SurahTheme | null {
  return allSurahThemes().find(t => t.surah === surah) ?? null;
}

/** Surahs whose centre of gravity is this category (primary), and those touching it. */
export function surahsInCategory(key: string): { primary: SurahTheme[]; secondary: SurahTheme[] } {
  const all = allSurahThemes();
  return {
    primary: all.filter(t => t.primary === key),
    secondary: all.filter(t => t.primary !== key && t.secondary.includes(key)),
  };
}

export function surahsWithLogic(key: string): SurahTheme[] {
  return allSurahThemes().filter(t => t.logics.includes(key));
}

export function logicCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of allSurahThemes()) for (const l of t.logics) out[l] = (out[l] ?? 0) + 1;
  return out;
}

export function categoryCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of allSurahThemes()) out[t.primary] = (out[t.primary] ?? 0) + 1;
  return out;
}

/** Makkan/Madinan split for a set of surahs, used on the category pages. */
export function revelationSplit(ts: SurahTheme[]): { makkah: number; madinah: number } {
  let makkah = 0;
  let madinah = 0;
  for (const t of ts) {
    const m = surahMeta(t.surah);
    if (m?.place === 'madinah') madinah++;
    else if (m) makkah++;
  }
  return { makkah, madinah };
}
