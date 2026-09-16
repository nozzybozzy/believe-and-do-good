import Link from 'next/link';
import { getChapters } from '@/lib/quran';

export const revalidate = 86400;

export default async function QuranIndex() {
  const chapters = await getChapters();
  return (
    <main className="container">
      <h1>The Quran</h1>
      <p className="lead">114 surahs with Saheeh International translation and Tafsir Ibn Kathir. Tap a surah to read, or open it in the player.</p>
      <div className="grid">
        {chapters.map(c => (
          <Link key={c.id} href={`/quran/${c.id}`} className="card">
            <div className="num">Surah {c.id}</div>
            <div className="ar">{c.name_arabic}</div>
            <div className="en">{c.name_simple} <span className="note">— {c.translated_name.name}</span></div>
            <div className="meta">{c.verses_count} ayahs · {c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan'}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
