'use client';
import { useEffect, useState } from 'react';

const KEY = 'bdg:translit';

/**
 * Transliteration on/off for the reader. The choice is written to <html> as a
 * data attribute and CSS does the hiding, so toggling costs no re-render.
 * Defaults to on; localStorage can be unavailable, which is fine.
 */
export default function ReaderPrefs() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private mode */ }
    if (saved === 'off') setOn(false);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.translit = on ? 'on' : 'off';
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  }, [on]);

  return (
    <button className={'chip' + (on ? ' on' : '')} onClick={() => setOn(v => !v)} aria-pressed={on}>
      Transliteration {on ? 'on' : 'off'}
    </button>
  );
}
