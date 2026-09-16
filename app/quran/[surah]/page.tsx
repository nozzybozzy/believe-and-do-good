import Link from 'next/link';
import { getSurahBundle } from '@/lib/quran';
import TafsirPanel from '@/components/quran/TafsirPanel';

export const revalidate = 86400;

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = parseInt(surah);
  const b = await getSurahBundle(n);
  const c = b.chapter;
  return (
    <main className="container">
      <div className="note">Surah {c.id} · {c.verses_count} ayahs · {c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan'}</div>
      <h1>{c.name_simple} <span className="ar" style={{ color: 'var(--gold)' }}>{c.name_arabic}</span></h1>
      <p className="lead">{c.translated_name.name}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Link href={`/player/${c.id}`} className="btn gold">▶ Listen in player</Link>
        {n > 1 && <Link href={`/quran/${n - 1}`} className="btn">← Previous</Link>}
        {n < 114 && <Link href={`/quran/${n + 1}`} className="btn">Next →</Link>}
      </div>

      {b.ayahs.map(a => (
        <article key={a.key} id={`ayah-${a.numberInSurah}`} className="ayah">
          <div className="ar-text ar">{a.full} <span className="badge">{a.numberInSurah}</span></div>
          <div className="en-text">{a.english}</div>
          <TafsirPanel surah={n} ayah={a.numberInSurah} />
        </article>
      ))}
    </main>
  );
}
