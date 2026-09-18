import Link from 'next/link';
import { getSurahBundle } from '@/lib/quran';
import { tafsirFor, notesByAyah, readingMinutes } from '@/lib/tafsir';
import { seerahSnippetsJson } from '@/lib/seerah';
import TafsirPanel from '@/components/quran/TafsirPanel';

export const revalidate = 86400;

function firstParagraph(html: string): string {
  const m = html.match(/<p>[\s\S]*?<\/p>/);
  return m ? m[0] : '';
}

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = parseInt(surah);
  const b = await getSurahBundle(n);
  const c = b.chapter;

  const docs = tafsirFor(n);
  const notes = notesByAyah(n);
  const stories = seerahSnippetsJson(n);
  const intro = docs[0]?.sections.find(s => s.kind === 'intro');
  const summary = docs[docs.length - 1]?.sections.find(s => s.kind === 'summary');

  return (
    <main className="container">
      <div className="note">Surah {c.id} · {c.verses_count} ayahs · {c.revelation_place === 'makkah' ? 'Meccan' : 'Medinan'}</div>
      <h1>{c.name_simple} <span className="ar" style={{ color: 'var(--gold)' }}>{c.name_arabic}</span></h1>
      <p className="lead">{c.translated_name.name}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <Link href={`/player/${c.id}`} className="btn gold">▶ Listen in player</Link>
        {docs.length > 0 && <Link href={`/tafsir/${n}`} className="btn gold">Tafsir notes</Link>}
        {n > 1 && <Link href={`/quran/${n - 1}`} className="btn">← Previous</Link>}
        {n < 114 && <Link href={`/quran/${n + 1}`} className="btn">Next →</Link>}
      </div>

      {docs.length > 0 && (
        <aside className="notes-card">
          <h4>{intro ? intro.heading.replace(/^\d+\.\s*/, '') : 'Distilled tafsir'}</h4>
          {intro && <div className="prose" dangerouslySetInnerHTML={{ __html: firstParagraph(intro.html) }} />}
          <Link href={`/tafsir/${n}`} className="btn">Read the full notes · {readingMinutes(docs)} min</Link>
        </aside>
      )}

      {b.ayahs.map(a => {
        const here = notes.get(a.numberInSurah) ?? [];
        return (
          <article key={a.key} id={`ayah-${a.numberInSurah}`} className="ayah">
            <div className="ar-text ar">{a.full} <span className="badge">{a.numberInSurah}</span></div>
            <div className="en-text">{a.english}</div>

            {here.map(({ section: s, first }) => {
              const r = s.ranges.find(x => x.surah === n && x.from <= a.numberInSurah && x.to >= a.numberInSurah)!;
              const span = r.from === r.to ? `ayah ${r.from}` : `ayat ${r.from}–${r.to}`;
              return first ? (
                <details key={s.id} className="owner-note">
                  <summary>
                    <span className="label">Notes</span>
                    <span dangerouslySetInnerHTML={{ __html: s.headingHtml.replace(/^\d+\.\s*/, '') }} />
                  </summary>
                  <div className="prose" dangerouslySetInnerHTML={{ __html: s.html }} />
                  <Link href={`/tafsir/${n}#${s.id}`} className="note">Open in the full notes →</Link>
                </details>
              ) : (
                <a key={s.id} href={`#ayah-${r.from}`} className="note-ref">
                  Notes: {s.heading.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*\d[^)]*\)\s*$/, '')} <span>({span}, opens at ayah {r.from})</span>
                </a>
              );
            })}

            {(stories[a.numberInSurah] ?? []).filter(s => s.first).map(s => (
              <aside key={s.slug} className="seerah-snippet">
                <span className="label">Seerah</span>
                <Link href={`/seerah/${s.slug}`} className="ss-title">{s.title}</Link>
                <p>{s.snippet}</p>
              </aside>
            ))}

            <div className="tools">
              <Link href={`/quran/${n}/${a.numberInSurah}`} className="btn">Open {n}:{a.numberInSurah}</Link>
              <Link href={`/player/${n}?ayah=${a.numberInSurah}`} className="btn">▶ Listen</Link>
            </div>

            <TafsirPanel surah={n} ayah={a.numberInSurah} />
          </article>
        );
      })}

      {summary && (
        <aside className="notes-card summary">
          <h4>{summary.heading.replace(/^\d+\.\s*/, '')}</h4>
          <div className="prose" dangerouslySetInnerHTML={{ __html: summary.html }} />
          <Link href={`/tafsir/${n}`} className="btn">Read the full notes</Link>
        </aside>
      )}
    </main>
  );
}
