'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Hit = {
  kind: string;
  id: string;
  title: string;
  url: string;
  surah: number;
  ayah: number;
  snippet: string;
};
type Res = { query: string; total: number; counts: Record<string, number>; hits: Hit[] };

const KINDS: { key: string; label: string }[] = [
  { key: 'ayah', label: 'Quran' },
  { key: 'tafsir', label: 'Tafsir notes' },
  { key: 'seerah', label: 'Seerah' },
  { key: 'name', label: 'Names of Allah' },
  { key: 'dua', label: 'Duas' },
  { key: 'wisdom', label: 'Wisdom' },
];

const LABEL: Record<string, string> = Object.fromEntries(KINDS.map(k => [k.key, k.label]));

export default function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState<string | null>(params.get('kind'));
  const [res, setRes] = useState<Res | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  // Debounced, and out-of-order responses are discarded.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRes(null); setLoading(false); return; }
    setLoading(true);
    const mine = ++seq.current;
    const t = setTimeout(() => {
      const url = `/api/search?q=${encodeURIComponent(term)}${kind ? `&kind=${kind}` : ''}`;
      fetch(url)
        .then(r => r.json())
        .then((j: Res) => { if (mine === seq.current) { setRes(j); setLoading(false); } })
        .catch(() => { if (mine === seq.current) setLoading(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [q, kind]);

  // Keep the URL shareable without pushing a history entry per keystroke.
  useEffect(() => {
    const term = q.trim();
    const next = term ? `/search?q=${encodeURIComponent(term)}${kind ? `&kind=${kind}` : ''}` : '/search';
    window.history.replaceState(null, '', next);
  }, [q, kind, router]);

  return (
    <>
      <div className="filters">
        <input
          className="search"
          autoFocus
          placeholder="Search the Quran, the notes, the seerah, the names, duas…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="chips" style={{ marginTop: 14 }}>
        <button className={'chip' + (kind === null ? ' on' : '')} onClick={() => setKind(null)}>
          Everything {res ? <span style={{ opacity: 0.55 }}>{res.total}</span> : null}
        </button>
        {KINDS.map(k => (
          <button
            key={k.key}
            className={'chip' + (kind === k.key ? ' on' : '')}
            onClick={() => setKind(kind === k.key ? null : k.key)}
          >
            {k.label}{' '}
            <span style={{ opacity: 0.55 }}>{res?.counts?.[k.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {q.trim().length >= 2 && (
        <p className="note" style={{ marginTop: 16 }}>
          {loading ? 'Searching…' : res ? `${res.total} result${res.total === 1 ? '' : 's'}` : ''}
        </p>
      )}

      {res?.hits.map(h => (
        <Link key={h.id} href={h.url} className="hit">
          <span className="hit-kind">{LABEL[h.kind] ?? h.kind}</span>
          <span className="hit-title">{h.title}</span>
          <span className="hit-snippet">{h.snippet}</span>
        </Link>
      ))}

      {res && res.hits.length === 0 && !loading && (
        <div className="soon">Nothing matched “{res.query}”.</div>
      )}

      {q.trim().length < 2 && (
        <div className="soon">
          Type at least two letters. English or Arabic — Arabic matches regardless of vowel marks.
        </div>
      )}
    </>
  );
}
