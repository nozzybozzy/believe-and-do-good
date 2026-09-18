import { allWisdom, wisdomThemes, TYPES } from '@/lib/wisdom';
import { allSeerah } from '@/lib/seerah';
import WisdomList, { type WisdomCard } from '@/components/wisdom/WisdomList';

export const metadata = {
  title: 'Wisdom — Believe & Do Good',
  description: 'The recurring logics of the Qur’an, moments from the seerah, and lines worth keeping.',
};

export default function WisdomPage() {
  const items = allWisdom();
  const seerahTitles = new Map(allSeerah().map(e => [e.slug, e.title]));

  const cards: WisdomCard[] = items.map(w => ({
    type: w.type,
    slug: w.slug,
    title: w.title,
    attribution: w.attribution,
    logic: w.logic,
    themes: w.themes,
    relatedAyahLabels: w.relatedAyahLabels,
    relatedAyahHrefs: w.relatedAyahs.map(r =>
      r.from === r.to ? `/quran/${r.surah}/${r.from}` : `/quran/${r.surah}#ayah-${r.from}`
    ),
    seerah: w.seerah
      .filter(s => seerahTitles.has(s))
      .map(s => ({ slug: s, title: seerahTitles.get(s)! })),
    html: w.html,
    haystack: [w.title, w.attribution, w.themes.join(' '), w.html.replace(/<[^>]+>/g, ' ')]
      .join(' ')
      .toLowerCase(),
  }));

  return (
    <main className="container">
      <h1>Wisdom</h1>
      <p className="lead">
        The Qur&apos;an teaches at least as much through shape as through subject. These are the
        recurring logics drawn out of the tafsir notes across all 114 surahs, together with the
        moments from the seerah and the lines that carry them.
      </p>

      <div className="grid" style={{ marginTop: 20 }}>
        {TYPES.map(t => (
          <div key={t.key} className="card">
            <div className="num">{items.filter(i => i.type === t.key).length}</div>
            <div className="en">{t.label}</div>
            <div className="meta">{t.blurb}</div>
          </div>
        ))}
      </div>

      <WisdomList items={cards} themes={wisdomThemes()} />

      <p className="source-note">
        The lessons are distilled from the owner&apos;s own synthesis of the complete Ibn Kathir
        summary project across all 114 surahs. The stories are drawn from the{' '}
        <a href="/seerah">seerah</a>, written as original prose from the standard sources.
      </p>
    </main>
  );
}
