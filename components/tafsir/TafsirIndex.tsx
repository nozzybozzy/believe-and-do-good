'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type TafsirCard = {
  n: number;
  name: string;
  meaning: string;
  ayat: number;
  place: 'makkah' | 'madinah';
  has: boolean;
  minutes: number;
  teaser: string;
  shared?: string;
};

type Filter = 'all' | 'makkah' | 'madinah' | 'short';

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['makkah', 'Meccan'],
  ['madinah', 'Medinan'],
  ['short', 'Under 10 min'],
];

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

export default function TafsirIndex({ cards }: { cards: TafsirCard[] }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filter>('all');

  const shown = useMemo(() => {
    const nq = norm(q);
    return cards.filter(c => {
      if (f === 'makkah' || f === 'madinah') { if (c.place !== f) return false; }
      if (f === 'short' && !(c.has && c.minutes < 10)) return false;
      if (!nq) return true;
      return String(c.n) === q.trim() || norm(c.name).includes(nq) || norm(c.meaning).includes(nq) || norm(c.teaser).includes(nq);
    });
  }, [cards, q, f]);

  return (
    <>
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search by name, meaning or number"
          value={q}
          onChange={e => setQ(e.target.value)}
          aria-label="Search surahs"
        />
        <div className="chips" role="group" aria-label="Filter">
          {FILTERS.map(([k, label]) => (
            <button key={k} className={`chip${f === k ? ' on' : ''}`} onClick={() => setF(k)} aria-pressed={f === k}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="note" style={{ marginTop: 10 }}>{shown.length} surah{shown.length === 1 ? '' : 's'}</div>
      <div className="grid tafsir-grid">
        {shown.map(c =>
          c.has ? (
            <Link key={c.n} href={`/tafsir/${c.n}`} className="card">
              <div className="num">Surah {c.n} · {c.place === 'makkah' ? 'Meccan' : 'Medinan'}</div>
              <div className="en">{c.name} <span className="note">· {c.meaning}</span></div>
              {c.teaser && <p className="teaser">{c.teaser}</p>}
              <div className="meta">
                {c.ayat} ayat · {c.minutes} min read{c.shared ? ` · with ${c.shared.split('&').map(s => s.trim()).find(s => s !== c.name) ?? ''}` : ''}
              </div>
            </Link>
          ) : (
            <div key={c.n} className="card muted">
              <div className="num">Surah {c.n}</div>
              <div className="en">{c.name}</div>
              <div className="meta">Notes not written yet</div>
            </div>
          ),
        )}
      </div>
    </>
  );
}
