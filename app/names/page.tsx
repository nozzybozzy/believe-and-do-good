import Link from 'next/link';
import { allNames } from '@/lib/names';

export const metadata = {
  title: 'The Names of Allah · Believe & Do Good',
  description: 'The ninety-nine names: what each one means, the lesson it carries, and how to invoke it.',
};

export default function NamesPage() {
  const names = allNames();
  const verbatim = names.filter(n => n.verbatimInQuran).length;

  return (
    <main className="container">
      <h1>The Names of Allah</h1>
      <p className="lead">
        The ninety-nine names as listed in the hadith of at-Tirmidhi. What each one means, the
        lesson it carries, and when to call on it.
      </p>

      <div className="names-grid">
        {names.map(n => (
          <Link key={n.slug} href={`/names/${n.slug}`} className="name-card">
            <span className="name-num">{n.number}</span>
            <span className="name-ar ar">{n.arabic}</span>
            <span className="name-tr">{n.transliteration}</span>
            <span className="name-meaning">{n.meaningShort}</span>
          </Link>
        ))}
      </div>

      <p className="source-note">
        Each name&apos;s Qur&apos;anic references are <strong>derived</strong>, not recalled: a script
        searches the Uthmani text for the word itself, so every reference shown can be checked.
        {' '}{verbatim} of the ninety-nine appear in the Qur&apos;an as the word given here; the
        remaining {names.length - verbatim} are known from the hadith list and occur in the Book only
        in related verbal or indefinite forms, which each page says plainly.
        Entries are written as original prose drawing on al-Ghazali&apos;s <em>Al-Maqṣad al-Asnā</em>,
        Ibn al-Qayyim, and Ibn Uthaymeen&apos;s <em>Al-Qawāʿid al-Muthlā</em>.
      </p>
    </main>
  );
}
