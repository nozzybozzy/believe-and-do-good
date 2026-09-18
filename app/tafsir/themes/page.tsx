import Link from 'next/link';
import {
  CATEGORIES, LOGICS, allSurahThemes, categoryCounts, logicCounts,
  surahsInCategory, revelationSplit,
} from '@/lib/themes';
import { surahMeta } from '@/lib/surahs';

export const metadata = {
  title: 'Themes · Believe & Do Good',
  description: 'The eight categories and fourteen recurring logics of the Qur’an, with all 114 surahs tagged against them.',
};

export default function ThemesPage() {
  const all = allSurahThemes();
  const cats = categoryCounts();
  const logs = logicCounts();

  return (
    <main className="container">
      <div className="note"><Link href="/tafsir">Tafsir notes</Link> · Themes</div>
      <h1>Themes</h1>
      <p className="lead">
        The framework built outward from the Qur&apos;an&apos;s own three subjects: eight working
        categories, and the fourteen recurring logics that run through all of them. Every one of the
        114 surahs is tagged against both.
      </p>

      <h2>The eight categories</h2>
      <p className="note">
        Primary category means centre of gravity, not exclusivity. Al-Baqarah touches all eight.
      </p>
      <div className="grid" style={{ marginTop: 18 }}>
        {CATEGORIES.map(c => {
          const { primary } = surahsInCategory(c.key);
          const split = revelationSplit(primary);
          return (
            <Link key={c.key} href={`/tafsir/themes/${encodeURIComponent(c.key.replace('§', 'c'))}`} className="card">
              <div className="num">{c.key} · {cats[c.key] ?? 0} surahs</div>
              <div className="en">{c.title}</div>
              <div className="meta">{c.subtitle}</div>
              <div className="meta" style={{ marginTop: 6, opacity: 0.75 }}>
                {split.makkah} Meccan · {split.madinah} Medinan
              </div>
            </Link>
          );
        })}
      </div>

      <h2 style={{ marginTop: 40 }}>The fourteen logics</h2>
      <p className="note">
        Not topics. The argumentative and moral patterns the Book uses everywhere. This is where
        most of its hidden teaching lives, because these are properties of <em>how</em> it argues.
      </p>
      <div className="grid tafsir-grid" style={{ marginTop: 18 }}>
        {LOGICS.map(l => (
          <Link key={l.key} href={`/tafsir/themes/${l.slug}`} className="card">
            <div className="num">{l.key} · {logs[l.key] ?? 0} surahs</div>
            <div className="en">{l.title}</div>
            <div className="teaser">{l.gist}</div>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>All 114, tagged</h2>
      <div className="theme-table">
        {all.map(t => {
          const m = surahMeta(t.surah);
          return (
            <Link key={t.surah} href={`/tafsir/${t.surah}`} className="theme-row">
              <span className="tr-num">{t.surah}</span>
              <span className="tr-name">{m?.name ?? t.name}</span>
              <span className="tr-cat">{t.primary}{t.secondary.length ? ` ${t.secondary.join(' ')}` : ''}</span>
              <span className="tr-logics">{t.logics.join(' · ')}</span>
            </Link>
          );
        })}
      </div>

      <p className="source-note">
        From the owner&apos;s <em>Core Themes of the Glorious Qur&apos;an</em>, a synthesis of the
        complete Ibn Kathir summary project across all 114 surahs. The tagging is read directly from
        that document&apos;s master index.
      </p>
    </main>
  );
}
