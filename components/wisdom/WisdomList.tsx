'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export type WisdomCard = {
  type: 'quote' | 'lesson' | 'story' | 'poem';
  slug: string;
  title: string;
  attribution: string;
  logic: string | null;
  themes: string[];
  relatedAyahLabels: string[];
  relatedAyahHrefs: string[];
  seerah: { slug: string; title: string }[];
  html: string;
  haystack: string;
};

const TYPE_LABEL: Record<string, string> = { lesson: 'Lesson', story: 'Story', quote: 'Quote', poem: 'Poem' };
const TYPE_PLURAL: Record<string, string> = { lesson: 'Lessons', story: 'Stories', quote: 'Quotes', poem: 'Poems' };

export default function WisdomList({
  items,
  themes,
}: {
  items: WisdomCard[];
  themes: { slug: string; count: number }[];
}) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | 'lesson' | 'story' | 'quote' | 'poem'>('all');
  const [theme, setTheme] = useState<string | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(w => {
      if (type !== 'all' && w.type !== type) return false;
      if (theme && !w.themes.includes(theme)) return false;
      if (needle && !w.haystack.includes(needle)) return false;
      return true;
    });
  }, [items, q, type, theme]);

  return (
    <>
      <div className="filters">
        <input
          className="search"
          placeholder="Search: gratitude, mercy, the orphan, Ta'if…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="chips">
          {(['all', 'lesson', 'story', 'quote', 'poem'] as const).map(t => (
            <button key={t} className={'chip' + (type === t ? ' on' : '')} onClick={() => setType(t)}>
              {t === 'all' ? 'Everything' : TYPE_PLURAL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="chips" style={{ marginTop: 14 }}>
        <button className={'chip small' + (theme === null ? ' on' : '')} onClick={() => setTheme(null)}>
          All themes
        </button>
        {themes.map(t => (
          <button
            key={t.slug}
            className={'chip small' + (theme === t.slug ? ' on' : '')}
            onClick={() => setTheme(theme === t.slug ? null : t.slug)}
          >
            {t.slug.replace(/-/g, ' ')} <span style={{ opacity: 0.55 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        {shown.length} of {items.length}
      </p>

      {shown.map(w => (
        <article key={`${w.type}-${w.slug}`} id={w.slug} className={`wis wis-${w.type}`}>
          <div className="wis-head">
            <span className="wis-kind">
              {TYPE_LABEL[w.type]}
              {w.logic && <span className="wis-logic">{w.logic}</span>}
            </span>
            <h3>{w.title}</h3>
            {w.attribution && <p className="note">{w.attribution}</p>}
          </div>

          <div className="prose" dangerouslySetInnerHTML={{ __html: w.html }} />

          <div className="wis-foot">
            <div className="chips">
              {w.themes.map(t => (
                <button key={t} className="chip small" onClick={() => setTheme(t)}>
                  {t.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            <div className="dua-links">
              {w.relatedAyahLabels.map((label, i) => (
                <Link key={label} href={w.relatedAyahHrefs[i]} className="btn">{label}</Link>
              ))}
              {w.seerah.map(s => (
                <Link key={s.slug} href={`/seerah/${s.slug}`} className="btn gold">{s.title}</Link>
              ))}
            </div>
          </div>
        </article>
      ))}

      {shown.length === 0 && <div className="soon">Nothing matches that filter.</div>}
    </>
  );
}
