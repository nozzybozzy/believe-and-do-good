'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export type DuaCard = {
  slug: string;
  title: string;
  kind: 'quranic' | 'prophetic';
  reference: string;
  source: string;
  occasion: string[];
  arabic: string;
  transliteration: string | null;
  translation: string;
  noteHtml: string;
  needsVerification: boolean;
  surah: number | null;
  ayahFrom: number | null;
  haystack: string;
};

export default function DuaList({
  duas,
  occasions,
}: {
  duas: DuaCard[];
  occasions: { slug: string; count: number }[];
}) {
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState<string | null>(null);
  const [kind, setKind] = useState<'all' | 'quranic' | 'prophetic'>('all');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return duas.filter(d => {
      if (kind !== 'all' && d.kind !== kind) return false;
      if (occ && !d.occasion.includes(occ)) return false;
      if (needle && !d.haystack.includes(needle)) return false;
      return true;
    });
  }, [duas, q, occ, kind]);

  return (
    <>
      <div className="filters">
        <input
          className="search"
          placeholder="Search duas: patience, parents, debt, forgiveness…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="chips">
          {(['all', 'quranic', 'prophetic'] as const).map(k => (
            <button key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>
              {k === 'all' ? 'All' : k === 'quranic' ? 'From the Qur’an' : 'From the Sunnah'}
            </button>
          ))}
        </div>
      </div>

      <div className="chips" style={{ marginTop: 14 }}>
        <button className={'chip small' + (occ === null ? ' on' : '')} onClick={() => setOcc(null)}>
          Every occasion
        </button>
        {occasions.map(o => (
          <button
            key={o.slug}
            className={'chip small' + (occ === o.slug ? ' on' : '')}
            onClick={() => setOcc(occ === o.slug ? null : o.slug)}
          >
            {o.slug.replace(/-/g, ' ')} <span style={{ opacity: 0.55 }}>{o.count}</span>
          </button>
        ))}
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        {shown.length} of {duas.length} duas
      </p>

      {shown.map(d => (
        <article key={d.slug} id={d.slug} className="dua">
          <div className="dua-head">
            <h3>{d.title}</h3>
            <span className="note">{d.reference}</span>
          </div>

          <div className="dua-ar ar">{d.arabic}</div>
          {d.transliteration && <div className="dua-translit">{d.transliteration}</div>}
          <div className="dua-en">{d.translation}</div>

          {d.noteHtml && <div className="prose dua-note" dangerouslySetInnerHTML={{ __html: d.noteHtml }} />}

          <div className="dua-foot">
            <div className="chips">
              {d.occasion.map(o => (
                <button key={o} className="chip small" onClick={() => setOcc(o)}>
                  {o.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            <div className="dua-links">
              {d.surah && d.ayahFrom && (
                <>
                  <Link href={`/quran/${d.surah}/${d.ayahFrom}`} className="btn">Read the ayah</Link>
                  <Link href={`/player/${d.surah}?ayah=${d.ayahFrom}`} className="btn">Listen</Link>
                </>
              )}
            </div>
          </div>

          {d.needsVerification && (
            <p className="verify">
              Arabic and reference not yet checked against a printed copy. Please verify before relying on it.
            </p>
          )}
        </article>
      ))}

      {shown.length === 0 && <div className="soon">Nothing matches that filter.</div>}
    </>
  );
}
