'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Note = {
  id: string;
  heading: string;
  headingHtml: string;
  html: string;
  from: number;
  to: number;
  first: boolean;
};
type NotesRes = { surah: number; hasNotes: boolean; minutes: number; byAyah: Record<string, Note[]> };

type Snippet = { slug: string; title: string; snippet: string; ayah: string; period: string };
type SeerahRes = { surah: number; byAyah: Record<string, Snippet[]> };

/**
 * Everything worth reading about the ayah the player is on:
 * the owner's distilled note, Ibn Kathir, and any seerah entry tied to it.
 */
export default function LearnMore({
  surah,
  ayah,
  surahName,
  english,
}: {
  surah: number;
  ayah: number;
  surahName: string;
  english: string;
}) {
  const [notes, setNotes] = useState<NotesRes | null>(null);
  const [seerah, setSeerah] = useState<SeerahRes | null>(null);

  // Per-surah payloads, fetched once when the surah changes.
  useEffect(() => {
    let alive = true;
    setNotes(null);
    setSeerah(null);
    fetch(`/api/notes/${surah}`).then(r => r.json()).then(j => alive && setNotes(j)).catch(() => {});
    fetch(`/api/seerah/${surah}`).then(r => r.json()).then(j => alive && setSeerah(j)).catch(() => {});
    return () => { alive = false; };
  }, [surah]);

  // Ibn Kathir is per ayah, so it is fetched on demand.
  const [ikOpen, setIkOpen] = useState(false);
  const [ik, setIk] = useState<string | null>(null);
  const [ikLoading, setIkLoading] = useState(false);

  useEffect(() => { setIkOpen(false); setIk(null); }, [surah, ayah]);

  async function loadIbnKathir() {
    if (ik === null) {
      setIkLoading(true);
      try {
        const r = await fetch(`/api/tafsir/${surah}/${ayah}`);
        const j = await r.json();
        setIk(j.text || '<p>No Ibn Kathir entry for this ayah.</p>');
      } catch {
        setIk('<p>Could not load Ibn Kathir just now.</p>');
      }
      setIkLoading(false);
    }
    setIkOpen(o => !o);
  }

  const here = notes?.byAyah?.[ayah] ?? [];
  const note = here.find(n => n.first) ?? here[0] ?? null;
  const stories = seerah?.byAyah?.[ayah] ?? [];
  const span = note ? (note.from === note.to ? `ayah ${note.from}` : `ayat ${note.from}–${note.to}`) : '';

  return (
    <section className="qp-learn">
      <div className="qp-learn-inner">
        <div className="eyebrow">Now playing</div>
        <h3>
          {surahName} {surah}:{ayah}
        </h3>
        {english && <p className="ayah-en">{english}</p>}

        {/* The owner's distilled note */}
        <div className="lm-block owner">
          <h4>Tafsir notes</h4>
          {note ? (
            <>
              <div
                className="lm-title"
                dangerouslySetInnerHTML={{ __html: note.headingHtml }}
              />
              <div className="lm-clamp">
                <div className="prose" dangerouslySetInnerHTML={{ __html: note.html }} />
              </div>
              <div className="lm-more">
                <Link href={`/tafsir/${surah}#${note.id}`} className="btn gold">
                  Read this note in full
                </Link>
                <span className="note">covers {span}</span>
              </div>
            </>
          ) : (
            <p className="lm-empty">
              {notes === null
                ? 'Loading…'
                : notes.hasNotes
                  ? 'No note is tied to this ayah — the surah notes cover it in passing.'
                  : 'No distilled notes for this surah yet.'}
              {notes?.hasNotes && (
                <>
                  {' '}
                  <Link href={`/tafsir/${surah}`} className="btn" style={{ marginLeft: 6 }}>
                    Open the surah notes
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        {/* Ibn Kathir, on demand */}
        <div className="lm-block">
          <h4>Tafsir Ibn Kathir</h4>
          <div className="lm-more" style={{ marginTop: 0 }}>
            <button className="btn" onClick={loadIbnKathir}>
              {ikOpen ? 'Hide' : ikLoading ? 'Loading…' : `Show Ibn Kathir on ${surah}:${ayah}`}
            </button>
          </div>
          {ikOpen && ik !== null && (
            <div className="prose" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: ik }} />
          )}
        </div>

        {/* Seerah */}
        {stories.length > 0 && (
          <div className="lm-block">
            <h4>From the Seerah</h4>
            {stories.map(s => (
              <div key={s.slug} style={{ marginBottom: 12 }}>
                <div className="lm-title">{s.title}</div>
                <div className="prose"><p>{s.snippet}</p></div>
                <div className="lm-more">
                  <Link href={`/seerah/${s.slug}`} className="btn gold">Read the chapter</Link>
                  <span className="note">linked to {s.ayah}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <nav className="lm-nav">
          <Link href={`/quran/${surah}#ayah-${ayah}`} className="btn">Read the surah</Link>
          <Link href={`/tafsir/${surah}`} className="btn">All notes on this surah</Link>
          <Link href="/seerah" className="btn">Seerah timeline</Link>
          <Link href="/duas" className="btn">Duas</Link>
        </nav>
      </div>
    </section>
  );
}
