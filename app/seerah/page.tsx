import Link from 'next/link';
import { seerahByPeriod, allSeerah } from '@/lib/seerah';

export const metadata = {
  title: 'Seerah — Believe & Do Good',
  description: 'The life of the Prophet ﷺ in fifty chapters, linked to the ayahs revealed at each stage.',
};

function year(e: { yearHijri: number | null; yearCe: number | null }): string {
  if (e.yearHijri) return `${e.yearHijri} AH`;
  return e.yearCe ? `${e.yearCe} CE` : '';
}

export default function SeerahIndex() {
  const groups = seerahByPeriod();
  const total = allSeerah().length;

  return (
    <main className="container">
      <h1>Seerah</h1>
      <p className="lead">
        The life of the Prophet ﷺ in {total} chapters, from the Year of the Elephant to the Farewell
        Pilgrimage — each one linked to the ayahs revealed around it.
      </p>

      {groups.map(g => (
        <section key={g.key} className="tl-period">
          <div className="tl-head">
            <h2 id={g.key}>{g.label}</h2>
            <p className="note">{g.blurb}</p>
          </div>
          <ol className="timeline">
            {g.entries.map(e => (
              <li key={e.slug} className="tl-item">
                <Link href={`/seerah/${e.slug}`} className="tl-link">
                  <span className="tl-year">{year(e)}</span>
                  <span className="tl-title">{e.title}</span>
                  <span className="tl-snippet">{e.snippet}</span>
                  {e.relatedAyahLabels.length > 0 && (
                    <span className="tl-refs">
                      {e.relatedAyahLabels.map(r => (
                        <span key={r} className="chip small">{r}</span>
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <p className="source-note">
        Written as original prose from the standard sources — Ibn Hisham, Ibn Kathir&apos;s
        <em> Al-Sira al-Nabawiyya</em>, the collections of al-Bukhari and Muslim, and a concise modern
        chronology. Facts and references are taken from them; the wording is our own.
      </p>
    </main>
  );
}
