import Link from 'next/link';
import { allSeerah } from '@/lib/seerah';
import { allDuas } from '@/lib/duas';
import { allWisdom } from '@/lib/wisdom';
import { surahsWithTafsir } from '@/lib/tafsir';

export default function Home() {
  const seerah = allSeerah().length;
  const duas = allDuas().length;
  const wisdom = allWisdom().length;
  const tafsir = surahsWithTafsir().size;

  return (
    <main className="container">
      <h1>Believe &amp; Do Good</h1>
      <p className="lead">
        Listen to the Quran with word-by-word highlighting, read the translation and Tafsir Ibn Kathir,
        and explore the Seerah, the Names of Allah, duas and wisdom, all in one place.
      </p>
      <div className="grid">
        <Link href="/player/1" className="card"><div className="num">Listen</div><div className="en">Quran Player</div><div className="meta">Saad Al-Ghamdi · word-by-word · notes for every ayah · export video</div></Link>
        <Link href="/quran" className="card"><div className="num">Read</div><div className="en">Quran</div><div className="meta">114 surahs · Saheeh International · Ibn Kathir</div></Link>
        <Link href="/tafsir" className="card"><div className="num">Understand</div><div className="en">Tafsir notes</div><div className="meta">Ibn Kathir distilled, all {tafsir} surahs</div></Link>
        <Link href="/seerah" className="card"><div className="num">Learn</div><div className="en">Seerah</div><div className="meta">{seerah} chapters on the life of the Prophet ﷺ, linked to the ayahs</div></Link>
        <Link href="/names" className="card"><div className="num">Know</div><div className="en">Names of Allah</div><div className="meta">Meanings, lessons, how to invoke</div></Link>
        <Link href="/duas" className="card"><div className="num">Ask</div><div className="en">Duas</div><div className="meta">{duas} supplications by occasion, with references</div></Link>
        <Link href="/wisdom" className="card"><div className="num">Reflect</div><div className="en">Wisdom</div><div className="meta">{wisdom} lessons, stories and quotes from across the Book</div></Link>
      </div>
    </main>
  );
}
