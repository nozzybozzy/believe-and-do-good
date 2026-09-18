import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSurahBundle, getIbnKathir } from '@/lib/quran';
import { sectionForAyah, tafsirFor } from '@/lib/tafsir';
import { seerahForAyah } from '@/lib/seerah';
import { duasForAyah } from '@/lib/duas';
import { surahMeta } from '@/lib/surahs';

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ surah: string; ayah: string }> }) {
  const { surah, ayah } = await params;
  const meta = surahMeta(parseInt(surah));
  return {
    title: meta ? `${meta.name} ${surah}:${ayah} — Believe & Do Good` : 'Ayah — Believe & Do Good',
  };
}

export default async function AyahPage({ params }: { params: Promise<{ surah: string; ayah: string }> }) {
  const p = await params;
  const n = parseInt(p.surah);
  const a = parseInt(p.ayah);
  const meta = surahMeta(n);
  if (!meta || !(a >= 1 && a <= meta.ayat)) notFound();

  const bundle = await getSurahBundle(n);
  const verse = bundle.ayahs.find(x => x.numberInSurah === a);
  if (!verse) notFound();

  const note = sectionForAyah(n, a);
  const hasNotes = tafsirFor(n).length > 0;
  const stories = seerahForAyah(n, a);
  const duas = duasForAyah(n, a);
  const ibnKathir = await getIbnKathir(n, a).catch(() => '');

  return (
    <main className="container">
      <div className="note">
        <Link href="/quran">Quran</Link> · <Link href={`/quran/${n}`}>{meta.name}</Link> · ayah {a} of {meta.ayat}
      </div>
      <h1>
        {meta.name} <span className="ar" style={{ color: 'var(--gold)' }}>{bundle.chapter.name_arabic}</span> {n}:{a}
      </h1>

      <div className="actions">
        <Link href={`/player/${n}?ayah=${a}`} className="btn gold">▶ Listen to this ayah</Link>
        <Link href={`/quran/${n}#ayah-${a}`} className="btn">Read in context</Link>
        {a > 1 && <Link href={`/quran/${n}/${a - 1}`} className="btn">← {n}:{a - 1}</Link>}
        {a < meta.ayat && <Link href={`/quran/${n}/${a + 1}`} className="btn">{n}:{a + 1} →</Link>}
      </div>

      <article className="ayah" style={{ borderBottom: 'none' }}>
        <div className="ar-text ar">{verse.full} <span className="badge">{a}</span></div>
        <div className="en-text">{verse.english}</div>
      </article>

      {verse.words.length > 0 && (
        <section className="wbw-card">
          <h4>Word by word</h4>
          <div className="wbw">
            {verse.words.map((w, i) => (
              <span key={i} className="wbw-word ar">{w}</span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Tafsir notes</h2>
        {note ? (
          <div className="notes-card">
            <h4 dangerouslySetInnerHTML={{ __html: note.headingHtml.replace(/^\d+\.\s*/, '') }} />
            <div className="prose" dangerouslySetInnerHTML={{ __html: note.html }} />
            <Link href={`/tafsir/${n}#${note.id}`} className="btn" style={{ marginTop: 10 }}>
              Open in the full notes →
            </Link>
          </div>
        ) : (
          <p className="note">
            {hasNotes
              ? 'No section is pinned to this ayah. '
              : 'No distilled notes for this surah yet. '}
            {hasNotes && <Link href={`/tafsir/${n}`}>Read the surah notes →</Link>}
          </p>
        )}
      </section>

      {ibnKathir && (
        <section>
          <h2>Tafsir Ibn Kathir</h2>
          <div className="tafsir">
            <div className="prose" dangerouslySetInnerHTML={{ __html: ibnKathir }} />
          </div>
        </section>
      )}

      {stories.length > 0 && (
        <section>
          <h2>From the Seerah</h2>
          {stories.map(s => (
            <div key={s.slug} className="notes-card">
              <h4>{s.title}</h4>
              <div className="prose"><p>{s.snippet}</p></div>
              <Link href={`/seerah/${s.slug}`} className="btn" style={{ marginTop: 10 }}>Read the chapter →</Link>
            </div>
          ))}
        </section>
      )}

      {duas.length > 0 && (
        <section>
          <h2>Duas from this passage</h2>
          <div className="grid">
            {duas.map(d => (
              <Link key={d.slug} href={`/duas#${d.slug}`} className="card">
                <div className="num">{d.occasion[0] ?? 'dua'}</div>
                <div className="ar">{d.arabic}</div>
                <div className="en">{d.title}</div>
                <div className="meta">{d.source}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="source-note">
        Arabic (Uthmani) and word segmentation from the Quran.com API · translation by Saheeh
        International via AlQuran.cloud · Tafsir Ibn Kathir (abridged, English) via the Quran.com API.
      </p>
    </main>
  );
}
