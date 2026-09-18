import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allSeerah, seerahBySlug, seerahNeighbours, seerahMinutes, PERIODS } from '@/lib/seerah';
import { surahMeta } from '@/lib/surahs';

export function generateStaticParams() {
  return allSeerah().map(e => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = seerahBySlug(slug);
  if (!e) return {};
  return { title: `${e.title} — Seerah — Believe & Do Good`, description: e.snippet };
}

export default async function SeerahEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = seerahBySlug(slug);
  if (!e) notFound();

  const { prev, next } = seerahNeighbours(slug);
  const period = PERIODS.find(p => p.key === e.period);
  const when = [e.yearHijri ? `${e.yearHijri} AH` : null, e.yearCe ? `${e.yearCe} CE` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="container">
      <div className="note">
        <Link href="/seerah">Seerah</Link> · {period?.label}
        {when ? ` · ${when}` : ''} · {seerahMinutes(e)} min
      </div>
      <h1>{e.title}</h1>
      {e.snippet && <p className="subtitle">{e.snippet}</p>}

      {e.relatedAyahs.length > 0 && (
        <div className="actions">
          {e.relatedAyahs.map((r, i) => {
            const meta = surahMeta(r.surah);
            return (
              <Link
                key={`${r.surah}-${r.from}-${i}`}
                href={`/quran/${r.surah}#ayah-${r.from}`}
                className="btn gold"
              >
                {meta ? meta.name : `Surah ${r.surah}`} {e.relatedAyahLabels[i] ?? `${r.surah}:${r.from}`}
              </Link>
            );
          })}
        </div>
      )}

      <article className="prose seerah-body" dangerouslySetInnerHTML={{ __html: e.html }} />

      {e.tags.length > 0 && (
        <div className="chips" style={{ marginTop: 28 }}>
          {e.tags.map(t => (
            <span key={t} className="chip small">{t.replace(/-/g, ' ')}</span>
          ))}
        </div>
      )}

      <nav className="prev-next">
        {prev ? (
          <Link href={`/seerah/${prev.slug}`} className="btn">← {prev.title}</Link>
        ) : <span />}
        {next ? (
          <Link href={`/seerah/${next.slug}`} className="btn">{next.title} →</Link>
        ) : <span />}
      </nav>

      {e.sources.length > 0 && (
        <p className="source-note">
          <strong>Sources consulted:</strong> {e.sources.join('; ')}. Written as original prose —
          facts, chronology and references are taken from these works, the wording is our own.
        </p>
      )}
    </main>
  );
}
