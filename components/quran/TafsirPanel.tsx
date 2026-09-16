'use client';
import { useState } from 'react';

export default function TafsirPanel({ surah, ayah }: { surah: number; ayah: number }) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && html === null) {
      setLoading(true);
      const r = await fetch(`/api/tafsir/${surah}/${ayah}`);
      const j = await r.json();
      setHtml(j.text || '<p>No tafsir available for this ayah.</p>');
      setLoading(false);
    }
    setOpen(!open);
  }

  return (
    <>
      <div className="tools">
        <button className="btn" onClick={toggle}>{open ? 'Hide tafsir' : loading ? 'Loading…' : 'Tafsir Ibn Kathir'}</button>
      </div>
      {open && html !== null && (
        <div className="tafsir">
          <h4>Tafsir Ibn Kathir</h4>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </>
  );
}
