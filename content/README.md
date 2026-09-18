# Content

Everything in this folder is editable markdown with YAML frontmatter. See CLAUDE.md §4 for the exact format of each type.

- `tafsir/`  — distilled Ibn Kathir notes, one file per surah: `tafsir/067-al-mulk.md`
  (Al-Baqarah is split into `-part-1` and `-part-2`; Al-Falaq and An-Nas share `113-al-falaq-and-an-nas.md`).
  Frontmatter: `surahs`, `name`, `title`, `subtitle`, `part`, `part_label`, `source`.
  Each `## ` heading becomes a section. Put the ayat in the heading, e.g. `## 3. Look Again (67:3–4)`,
  and the reader will show that section under those ayat. For headings that can't carry numbers,
  add the range to `tafsir/_ayah-map.json`.
  To re-import from the Claude Project: export the docs into `reference/tafsir-raw/` and run `npm run import:tafsir`.
- `seerah/`  — chronological entries: `seerah/012-first-revelation.md`
- `names/`   — the 99 names: `names/01-ar-rahman.md`
- `duas/`    — `duas/morning-protection.md`
- `wisdom/`  — `wisdom/quote/…`, `wisdom/lesson/…`, `wisdom/story/…`
- `themes.yaml` — theme list used for tagging
