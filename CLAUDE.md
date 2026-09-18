# Believe & Do Good, build brief

This repo was scaffolded from Claude.ai. Phase 0 (scaffold, proxy, player, reader with Ibn Kathir) is done and deployed.

Remaining phases, in order. Pause for owner review after each.

## Phase 2, Owner's content import

**Status (Sept 2026): tafsir done.** All 114 docs from the "Quran Tafsir" project are in `content/tafsir/`
(one file per surah, body verbatim). They are whole-surah essays, so they were kept as one file each rather than
split per ayah: `lib/tafsir.ts` splits them into sections and maps each section to its ayat from the heading
(`(67:3–4)`), a tight cluster of refs in the body, or `content/tafsir/_ayah-map.json`. ~93% of ayat are covered.
Built: `/tafsir` (search + filters), `/tafsir/[surah]` (static, with contents), notes above Ibn Kathir in
`/quran/[surah]`. The project held no duas, quotes or wisdom files, so 2.2 is still waiting on that content.
Still to do: theme tagging + `/tafsir/themes/[slug]`, the "Learn more" panel under the player (2.4).

The owner's tafsir notes, Ibn Kathir upload, and quotes/duas/wisdom live in a Claude Project called "Quran Tafsir". When they are provided (as files in `reference/` or pasted into chat):
1. Convert tafsir notes → `content/tafsir/{surah:03}/{surah:03}-{ayah:03}.md` with frontmatter: surah, ayah_from, ayah_to, title, themes[], names_of_allah[], seerah[], duas[], sources[]. Anything unplaceable → `content/tafsir/_unsorted/`.
2. Convert quotes/duas/wisdom → `content/duas/*.md` and `content/wisdom/{quote|lesson|story}/*.md`, `favourite: true`.
3. Build `lib/content.ts` (gray-matter + remark) and render notes above Ibn Kathir in `app/quran/[surah]`, plus `/tafsir`, `/tafsir/themes/[slug]`, `/duas`, `/wisdom`.
4. Add a "Learn more" panel below the player for the current ayah: owner note → Ibn Kathir → seerah snippet → names chips → duas.

## Phase 3, Sourced content (original prose, cite sources, never copy paragraphs)
1. 99 Names of Allah → `content/names/{nn}-{slug}.md`: arabic, transliteration, meanings, root, quran_occurrences, invocation, sections Meaning / Lessons / How to invoke / In the Quran. Sources: Al-Ghazali Al-Maqsad al-Asna, Ibn al-Qayyim, Ibn Uthaymeen, Yaqeen Institute. Pronunciation audio in `public/audio/names/`.
2. ~60 Seerah entries → `content/seerah/{order:03}-{slug}.md` with period, year_ce, tags, related_ayahs, snippet, sources (Ibn Hisham, Ar-Raheeq al-Makhtum, Ibn Kathir, Yaqeen, Lings, facts only).
3. Pages `/names`, `/names/[slug]`, `/seerah`, `/seerah/[slug]` + cross-links to ayah pages.

## Phase 4, Search
Supabase project `believe-and-do-good` (eu-west-2), table `search_docs` with tsvector + pg_trgm; `scripts/sync-search-index.ts` in postbuild; `/search` page grouped by kind. Free tier allows 2 projects, ask the owner before pausing `labbayk` or `halal-pro`.

## Rules
- Never fabricate hadith or Quran references; mark `needs_verification: true` if unsure.
- Keep the WebM export; do not add FFmpeg.wasm.
- Reciter: Saad Al-Ghamdi (quran.com chapter reciter 7). Translation: Saheeh International. Tafsir API: quran.com tafsir 169.
