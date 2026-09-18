import { allDuas, duaOccasions } from '@/lib/duas';
import DuaList, { type DuaCard } from '@/components/duas/DuaList';

export const metadata = {
  title: 'Duas · Believe & Do Good',
  description: 'Supplications from the Qur’an and the Sunnah, by occasion, with Arabic, transliteration, translation and references.',
};

export default function DuasPage() {
  const duas = allDuas();
  const quranic = duas.filter(d => d.kind === 'quranic').length;

  const cards: DuaCard[] = duas.map(d => ({
    slug: d.slug,
    title: d.title,
    kind: d.kind,
    reference: d.reference,
    source: d.source,
    occasion: d.occasion,
    arabic: d.arabic,
    transliteration: d.transliteration,
    translation: d.translation,
    noteHtml: d.noteHtml,
    needsVerification: d.needsVerification,
    surah: d.surah,
    ayahFrom: d.ayahFrom,
    haystack: [d.title, d.translation, d.transliteration ?? '', d.reference, d.occasion.join(' ')]
      .join(' ')
      .toLowerCase(),
  }));

  return (
    <main className="container">
      <h1>Duas</h1>
      <p className="lead">
        {duas.length} supplications, {quranic} of them straight out of the Qur&apos;an, the rest from
        the Sunnah. Arabic, transliteration, translation, and a note on where each one was said and why.
      </p>

      <DuaList duas={cards} occasions={duaOccasions()} />

      <p className="source-note">
        The Qur&apos;anic duas take their Arabic (Uthmani) from the Quran.com API and their translation
        from Saheeh International via AlQuran.cloud. Nothing is transcribed by hand. Duas from the
        Sunnah are marked with their collection; those still flagged for verification should be checked
        against a printed copy of <em>Hisn al-Muslim</em> or the source collection before use.
      </p>
    </main>
  );
}
