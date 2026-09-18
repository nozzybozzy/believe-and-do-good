import type { Metadata } from 'next';
import { SURAHS } from '@/lib/surahs';
import { tafsirFor, readingMinutes } from '@/lib/tafsir';
import TafsirIndex, { type TafsirCard } from '@/components/tafsir/TafsirIndex';

export const metadata: Metadata = {
  title: 'Tafsir · Believe & Do Good',
  description: 'Ibn Kathir’s tafsir of every surah, distilled into readable notes.',
};

function teaser(html: string): string {
  const para = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';
  const text = para.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  const m = text.match(/^(.{40,220}?[.!?])(\s|$)/);
  return m ? m[1] : text.slice(0, 200) + (text.length > 200 ? '…' : '');
}

export default function Tafsir() {
  const cards: TafsirCard[] = SURAHS.map(s => {
    const docs = tafsirFor(s.n);
    const intro = docs[0]?.sections.find(x => x.kind === 'intro');
    const first = intro ?? docs[0]?.sections[0];
    return {
      n: s.n,
      name: s.name,
      meaning: s.meaning,
      ayat: s.ayat,
      place: s.place,
      has: docs.length > 0,
      minutes: docs.length ? readingMinutes(docs) : 0,
      teaser: first ? teaser(first.html) : '',
      shared: docs[0] && docs[0].surahs.length > 1 ? docs[0].name : undefined,
    };
  });
  const total = cards.filter(c => c.has).length;

  return (
    <main className="container">
      <h1>Tafsir</h1>
      <p className="lead">
        Ibn Kathir’s commentary on every surah, distilled into notes you can read in one sitting.
        {` ${total} of 114 surahs.`} Each note links to the ayat it explains, and each ayah in the reader links back.
      </p>
      <TafsirIndex cards={cards} />
    </main>
  );
}
