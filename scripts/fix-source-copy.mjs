// One-off: removes em dashes from the copy in app/, lib/ and components/.
// Done as explicit pairs rather than a pattern, because five of the em dashes
// in these files sit inside regex character classes that match ayah ranges
// ([–—-]) and one strips a heading in the owner's own note titles. Those stay.
import fs from 'node:fs';

const EDITS = [
  // Page titles use the middle dot the site already uses in its breadcrumbs.
  ['app/duas/page.tsx', "'Duas — Believe & Do Good'", "'Duas · Believe & Do Good'"],
  ['app/names/page.tsx', "'The Names of Allah — Believe & Do Good'", "'The Names of Allah · Believe & Do Good'"],
  ['app/search/page.tsx', "'Search — Believe & Do Good'", "'Search · Believe & Do Good'"],
  ['app/seerah/page.tsx', "'Seerah — Believe & Do Good'", "'Seerah · Believe & Do Good'"],
  ['app/wisdom/page.tsx', "'Wisdom — Believe & Do Good'", "'Wisdom · Believe & Do Good'"],
  ['app/tafsir/themes/page.tsx', "'Themes — Believe & Do Good'", "'Themes · Believe & Do Good'"],
  ['app/names/[slug]/page.tsx', '`${n.transliteration} — ${n.meaningShort} — Believe & Do Good`', '`${n.transliteration} · ${n.meaningShort} · Believe & Do Good`'],
  ['app/player/[surah]/page.tsx', '`${meta.name} — Player — Believe & Do Good` : \'Player — Believe & Do Good\'', '`${meta.name} · Player · Believe & Do Good` : \'Player · Believe & Do Good\''],
  ['app/quran/[surah]/[ayah]/page.tsx', '`${meta.name} ${surah}:${ayah} — Believe & Do Good` : \'Ayah — Believe & Do Good\'', '`${meta.name} ${surah}:${ayah} · Believe & Do Good` : \'Ayah · Believe & Do Good\''],
  ['app/seerah/[slug]/page.tsx', '`${e.title} — Seerah — Believe & Do Good`', '`${e.title} · Seerah · Believe & Do Good`'],
  ['app/tafsir/themes/[slug]/page.tsx', '`${cat.key} ${cat.title} — Themes — Believe & Do Good`', '`${cat.key} ${cat.title} · Themes · Believe & Do Good`'],
  ['app/tafsir/themes/[slug]/page.tsx', '`${logic.key} ${logic.title} — Themes — Believe & Do Good`', '`${logic.key} ${logic.title} · Themes · Believe & Do Good`'],

  // Prose.
  ['app/duas/page.tsx', 'supplications — {quranic} of them', 'supplications, {quranic} of them'],
  ['app/duas/page.tsx', 'via AlQuran.cloud — nothing is transcribed by hand.', 'via AlQuran.cloud. Nothing is transcribed by hand.'],
  ['app/names/page.tsx', "'The ninety-nine names — meaning, the lesson each one carries, and how to invoke it.'", "'The ninety-nine names: what each one means, the lesson it carries, and how to invoke it.'"],
  ['app/names/page.tsx', 'the hadith of at-Tirmidhi — what each one means, the', 'the hadith of at-Tirmidhi. What each one means, the'],
  ['app/names/[slug]/page.tsx', '`${n.transliteration} (${n.arabic}) — ${n.meaningShort}.', '`${n.transliteration} (${n.arabic}). ${n.meaningShort}.'],
  ['app/names/[slug]/page.tsx', 'in the Uthmani text — found by searching it, not from a list.', 'in the Uthmani text, found by searching it, not from a list.'],
  ['app/page.tsx', 'duas and wisdom — all in one place.', 'duas and wisdom, all in one place.'],
  ['app/quran/page.tsx', '<span className="note">— {c.translated_name.name}</span>', '<span className="note">{c.translated_name.name}</span>'],
  ['app/quran/[surah]/[ayah]/page.tsx', '{nm.transliteration} — {nm.meaningShort}', '{nm.transliteration}, {nm.meaningShort}'],
  ['app/search/page.tsx', 'Across everything on the site — the Quran in Arabic and translation, the distilled tafsir', 'Searches the Quran in Arabic and translation, the distilled tafsir'],
  ['app/seerah/page.tsx', 'Pilgrimage — each one linked to the ayahs revealed around it.', 'Pilgrimage, each one linked to the ayahs revealed around it.'],
  ['app/seerah/page.tsx', 'original prose from the standard sources — Ibn Hisham, Ibn Kathir&apos;s', 'original prose from the standard sources: Ibn Hisham, Ibn Kathir&apos;s'],
  ['app/seerah/[slug]/page.tsx', 'Written as original prose —\n          facts, chronology and references are taken from these works, the wording is our own.', 'Written as original prose.\n          Facts, chronology and references are taken from these works. The wording is our own.'],
  ['app/tafsir/themes/page.tsx', "own three subjects — eight working", "own three subjects: eight working"],
  ['app/tafsir/themes/page.tsx', 'not exclusivity — Al-Baqarah touches all eight.', 'not exclusivity. Al-Baqarah touches all eight.'],
  ['app/tafsir/themes/page.tsx', 'Not topics — the argumentative and moral patterns', 'Not topics. The argumentative and moral patterns'],
  ['app/tafsir/themes/page.tsx', '</em> — a synthesis of the', '</em>, a synthesis of the'],
  ['app/tafsir/themes/[slug]/page.tsx', 'their centre of gravity — {split.makkah} Meccan,', 'their centre of gravity, {split.makkah} Meccan,'],
  ['app/tafsir/themes/[slug]/page.tsx', '{split.madinah} Medinan — and {secondary.length} more touch it.', '{split.madinah} Medinan, and {secondary.length} more touch it.'],
  ['app/tafsir/themes/[slug]/page.tsx', 'Where it runs — {items.length} surahs', 'Where it runs, in {items.length} surahs'],

  // lib and components.
  ['lib/names.ts', '// Loader for content/names — the ninety-nine names.', '// Loader for content/names, the ninety-nine names.'],
  ['lib/quran.ts', 'not scripture — if it fails, the page still works.', 'not scripture. If it fails, the page still works.'],
  ['lib/seerah.ts', "first revelation — 571 to 610 CE.", "first revelation, 571 to 610 CE."],
  ['lib/seerah.ts', "night of the Hijrah — thirteen years.", "night of the Hijrah, thirteen years."],
  ['lib/seerah.ts', "defending it — years 1 to 7 after the Hijrah.", "defending it, years 1 to 7 after the Hijrah."],
  ['lib/themes.ts', "that God exists — the signs argue", "that God exists. The signs argue"],
  ['lib/themes.ts', "subtitle: 'Tazkiyah — the moral psychology of the human being'", "subtitle: 'Tazkiyah, the moral psychology of the human being'"],
  ['lib/themes.ts', "'The outer law — almost entirely Madinan", "'The outer law, almost entirely Madinan"],
  ['lib/themes.ts', "gist: 'Not a power — a suggestion,", "gist: 'Not a power, only a suggestion,"],
  ['lib/wisdom.ts', '// Loader for content/wisdom — quotes, lessons and stories, one folder per type.', '// Loader for content/wisdom: quotes, lessons, poems and stories, one folder per type.'],
  ['lib/wisdom.ts', "'The recurring logics — the patterns the Book argues by, not just the topics it covers.'", "'The patterns the Book argues by, not just the topics it covers.'"],
  ['components/duas/DuaList.tsx', 'placeholder="Search duas — patience, parents, debt, forgiveness…"', 'placeholder="Search duas: patience, parents, debt, forgiveness…"'],
  ['components/duas/DuaList.tsx', 'against a printed copy — please verify before relying on it.', 'against a printed copy. Please verify before relying on it.'],
  ['components/player/LearnMore.tsx', "'No note is tied to this ayah — the surah notes cover it in passing.'", "'No note is tied to this ayah. The surah notes cover it in passing.'"],
  ['components/search/SearchBox.tsx', 'English or Arabic — Arabic matches regardless of vowel marks.', 'English or Arabic. Arabic matches regardless of vowel marks.'],
  ['components/wisdom/WisdomList.tsx', 'placeholder="Search — gratitude, mercy, the orphan, Ta\'if…"', 'placeholder="Search: gratitude, mercy, the orphan, Ta\'if…"'],
];

let done = 0;
const missed = [];
for (const [file, from, to] of EDITS) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) { missed.push(`${file}  ${from.slice(0, 60)}`); continue; }
  fs.writeFileSync(file, s.replace(from, to), 'utf8');
  done++;
}
console.log(`applied ${done} of ${EDITS.length}`);
if (missed.length) { console.log('NOT FOUND:'); missed.forEach(m => console.log('  ' + m)); }
