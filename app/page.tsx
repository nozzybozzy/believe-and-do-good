import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <h1>Believe &amp; Do Good</h1>
      <p className="lead">
        Listen to the Quran with word-by-word highlighting, read the translation and Tafsir Ibn Kathir,
        and explore the Seerah, the Names of Allah, duas and wisdom — all in one place.
      </p>
      <div className="grid">
        <Link href="/player/1" className="card"><div className="num">Listen</div><div className="en">Quran Player</div><div className="meta">Saad Al-Ghamdi · word-by-word · export video</div></Link>
        <Link href="/quran" className="card"><div className="num">Read</div><div className="en">Quran</div><div className="meta">114 surahs · Saheeh International · Ibn Kathir</div></Link>
        <Link href="/tafsir" className="card"><div className="num">Understand</div><div className="en">Tafsir notes</div><div className="meta">Ibn Kathir distilled, all 114 surahs</div></Link>
        <Link href="/seerah" className="card"><div className="num">Learn</div><div className="en">Seerah</div><div className="meta">The life of the Prophet ﷺ</div></Link>
        <Link href="/names" className="card"><div className="num">Know</div><div className="en">Names of Allah</div><div className="meta">Meanings, lessons, how to invoke</div></Link>
        <Link href="/duas" className="card"><div className="num">Ask</div><div className="en">Duas</div><div className="meta">By occasion, with references</div></Link>
        <Link href="/wisdom" className="card"><div className="num">Reflect</div><div className="en">Wisdom</div><div className="meta">Quotes, lessons, stories</div></Link>
      </div>
    </main>
  );
}
