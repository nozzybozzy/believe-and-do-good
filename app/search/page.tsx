import { Suspense } from 'react';
import SearchBox from '@/components/search/SearchBox';

export const metadata = {
  title: 'Search — Believe & Do Good',
  description: 'Search the Quran, the tafsir notes, the seerah, the names of Allah, duas and wisdom.',
};

export default function SearchPage() {
  return (
    <main className="container">
      <h1>Search</h1>
      <p className="lead">
        Across everything on the site — the Quran in Arabic and translation, the distilled tafsir
        notes, the seerah, the ninety-nine names, the duas and the wisdom.
      </p>
      <Suspense fallback={<div className="soon">Loading…</div>}>
        <SearchBox />
      </Suspense>
    </main>
  );
}
