import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allNames, nameBySlug, nameNeighbours } from '@/lib/names';
import { surahMeta } from '@/lib/surahs';

export function generateStaticParams() {
  return allNames().map(n => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = nameBySlug(slug);
  if (!n) return {};
  return {
    title: `${n.transliteration} · ${n.meaningShort} · Believe & Do Good`,
    description: `${n.transliteration} (${n.arabic}). ${n.meaningShort}. ${n.meanings.join('; ')}`,
  };
}

export default async function NamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = nameBySlug(slug);
  if (!n) notFound();
  const { prev, next } = nameNeighbours(slug);

  return (
    <main className="container">
      <div className="note">
        <Link href="/names">The Names of Allah</Link> · {n.number} of 99
      </div>

      <header className="name-hero">
        <div className="name-hero-ar ar">{n.arabic}</div>
        <h1>{n.transliteration}</h1>
        <p className="lead">{n.meaningShort}</p>
        {n.meanings.length > 0 && (
          <div className="chips" style={{ marginTop: 12 }}>
            {n.meanings.map(m => <span key={m} className="chip small">{m}</span>)}
          </div>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          Root <span className="ar" style={{ fontSize: 18 }}>{n.root}</span>
        </p>
      </header>

      {n.invocation && (
        <aside className="notes-card">
          <h4>How to invoke it</h4>
          <div className="prose"><p>{n.invocation}</p></div>
        </aside>
      )}

      <article className="prose name-body" dangerouslySetInnerHTML={{ __html: n.html }} />

      <section>
        <h2>In the Qur&apos;an</h2>
        {n.occurrences.length > 0 ? (
          <>
            <p className="note">
              Where this word appears in the Uthmani text, found by searching it, not from a list.
              Some verses use the word of something other than Allah; the reference is to the word.
            </p>
            <div className="actions">
              {n.occurrences.map(o => {
                const meta = surahMeta(o.surah);
                return (
                  <Link key={`${o.surah}:${o.ayah}`} href={`/quran/${o.surah}/${o.ayah}`} className="btn gold">
                    {meta ? meta.name : `Surah ${o.surah}`} {o.surah}:{o.ayah}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <p className="note">
            This name does not appear in the Qur&apos;an as this exact word. It comes from the list in
            the hadith of at-Tirmidhi, and the Book carries its meaning through related verbal or
            indefinite forms.
          </p>
        )}
      </section>

      {n.themes.length > 0 && (
        <div className="chips" style={{ marginTop: 28 }}>
          {n.themes.map(t => <span key={t} className="chip small">{t.replace(/-/g, ' ')}</span>)}
        </div>
      )}

      <nav className="prev-next">
        {prev ? <Link href={`/names/${prev.slug}`} className="btn">← {prev.transliteration}</Link> : <span />}
        {next ? <Link href={`/names/${next.slug}`} className="btn">{next.transliteration} →</Link> : <span />}
      </nav>
    </main>
  );
}
