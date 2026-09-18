# Believe & Do Good

Quran, Tafsir, Seerah, the Names of Allah, Duas and Islamic wisdom — in one place.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

- `app/player` — Quran video player (Saad Al-Ghamdi, word-by-word highlighting, video export),
  with a **Learn more** panel under the stage showing the notes, Ibn Kathir and seerah for the
  ayah currently playing. The URL tracks the ayah (`/player/2?ayah=255`), so links are shareable.
- `app/quran` — surah reader, plus `/quran/[surah]/[ayah]` deep-dive pages (word-by-word,
  notes, full Ibn Kathir, linked seerah, related duas)
- `app/tafsir` — the distilled Ibn Kathir notes, all 114 surahs
- `app/seerah` — the life of the Prophet ﷺ as a timeline, each chapter linked to its ayahs
- `app/names` — the ninety-nine names, with Qur'anic references derived from the text
- `app/duas`, `app/wisdom` — filterable collections
- `app/api/quran` — server-side proxy to Quran.com and AlQuran.cloud (no CORS issues)
- `app/api/notes/[surah]`, `app/api/seerah/[surah]` — per-ayah content for the player panel
- `content/` — all editable content as markdown
- `CLAUDE.md` — full build brief for the remaining phases

## Search

There is no database. `scripts/build-search-index.mjs` builds `data/search-index.json.gz` — 6,236
ayahs (Arabic and translation), plus every tafsir note, seerah chapter, name, dua and wisdom entry
— and `/api/search` reads it server-side. It runs automatically as `prebuild`, so the index can
never drift from the content, and a deploy needs no network and no credentials.

The Qur'an text it indexes is committed as `data/quran-source.json.gz` (0.5 MB) so the rebuild is
offline. Arabic is indexed with diacritics stripped, so `القيوم` matches regardless of vowel marks.
To rebuild by hand after adding content:

```bash
npm run index:search
```

## How the pieces link up

Everything is joined by **ayah references**. A tafsir section is tied to ayahs by the numbers in
its heading; a seerah chapter, dua or wisdom entry by its `related_ayahs` frontmatter. That single
convention is what lets the reader, the ayah pages and the player's Learn-more panel all find the
right material for whatever ayah you are on.

## Adding content

### A tafsir note — `content/tafsir/{nnn}-{slug}.md`

One file per surah (Al-Baqarah has two parts). Sections are `##` headings; the ayah numbers in a
heading (`3. The Throne Verse (255)`) are what bind the section to those ayahs. Where a heading
carries no numbers, add them to `content/tafsir/_ayah-map.json`.

### A seerah chapter — `content/seerah/{nnn}-{slug}.md`

```yaml
---
order: 13                     # position in the timeline
slug: the-first-revelation
title: "The First Revelation"
period: meccan                # pre-prophethood | meccan | medinan | final-years
year_ce: 610
year_hijri: null
tags: [revelation, jibreel]
related_ayahs: ["96:1-5"]     # drives every cross-link
sources: ["Ibn Hisham", "Sahih al-Bukhari"]
snippet: "One paragraph, used under the player and beside the ayah."
---
```

### A dua — `content/duas/{slug}.md`

Qur'anic duas are **generated**, never typed by hand:

```bash
node scripts/build-duas.mjs
```

Add an entry to the `DUAS` table in that script (slug, reference, title, occasions,
transliteration, note) and it pulls the Uthmani Arabic and the Saheeh translation from the APIs.
Where a supplication sits inside a longer narrative verse, add an anchor to the `TRIM` table so it
is cut to the supplication itself.

Duas from the Sunnah are written by hand and carry `needs_verification: true` until their Arabic
and reference have been checked against a printed source; the site shows a notice on those.

### A name of Allah — `content/names/{nn}-{slug}.md`

Write the entry with `number`, `slug`, `arabic`, `transliteration`, `meaning_short`, `meanings`,
`root`, `invocation` and `themes`, then let the references be found rather than recalled:

```bash
node scripts/build-name-occurrences.mjs
```

It fetches the Uthmani text once (cached in `reference/`), searches it for each name as a whole
word — handling the dagger alef and attached prefixes — and writes `quran_occurrences` plus
`verbatim_in_quran` back into the frontmatter. Names it cannot find are reported and marked, not
padded: 23 of the 99 come from the hadith list and appear in the Book only in related forms.

### Wisdom — `content/wisdom/{quote|lesson|story}/{slug}.md`

Frontmatter: `type`, `slug`, `title`, `attribution`, `themes`, `related_ayahs`, optional `seerah`
(entry slugs) and `logic` (`L1`–`L12`, the recurring logics from the Core Themes synthesis).

### Bulk authoring

`scripts/split-content.mjs <bundle> <outDir>` splits one file containing many entries, separated by
`===== FILE: <name>.md =====` lines, into individual content files.

## Attribution

Quran text (Uthmani) and word timings: Quran.com API. Translation: Saheeh International via
AlQuran.cloud. Transliteration: whole-ayah from AlQuran.cloud (`en.transliteration`), per-word from
the Quran.com API — readers can toggle it in the reader and in the player. Recitation: Saad Al-Ghamdi. Tafsir: Ibn Kathir (abridged, English) via Quran.com,
with the owner's own distilled notes layered above it. Seerah entries are original prose written
from the standard sources, which are listed in each file.
