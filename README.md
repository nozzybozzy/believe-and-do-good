# Believe & Do Good

Quran, Tafsir, Seerah, the Names of Allah, Duas and Islamic wisdom — in one place.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

- `app/player` — Quran video player (Saad Al-Ghamdi, word-by-word highlighting, video export)
- `app/quran` — Surah reader with Saheeh International translation and Tafsir Ibn Kathir
- `app/api/quran` — server-side proxy to Quran.com and AlQuran.cloud (no CORS issues)
- `content/` — all editable content as markdown: tafsir notes, seerah, names of Allah, duas, wisdom
- `CLAUDE.md` — full build brief for the remaining phases

## Adding content

See the README in each `content/*` folder for the frontmatter format.
