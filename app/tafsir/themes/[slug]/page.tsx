import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CATEGORIES, LOGICS, categoryByKey, logicBySlug,
  surahsInCategory, surahsWithLogic, revelationSplit, type SurahTheme,
} from '@/lib/themes';
import { surahMeta } from '@/lib/surahs';
import { allWisdom } from '@/lib/wisdom';

// Categories are addressed as c0…c7 because "§" does not belong in a URL.
const catSlug = (key: string) => key.replace('§', 'c');

export function generateStaticParams() {
  return [
    ...CATEGORIES.map(c => ({ slug: catSlug(c.key) })),
    ...LOGICS.map(l => ({ slug: l.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = CATEGORIES.find(c => catSlug(c.key) === slug);
  if (cat) return { title: `${cat.key} ${cat.title} · Themes · Believe & Do Good`, description: cat.blurb };
  const logic = logicBySlug(slug);
  if (logic) return { title: `${logic.key} ${logic.title} · Themes · Believe & Do Good`, description: logic.gist };
  return {};
}

function SurahGrid({ items }: { items: SurahTheme[] }) {
  if (!items.length) return <p className="note">None.</p>;
  return (
    <div className="grid" style={{ marginTop: 14 }}>
      {items.map(t => {
        const m = surahMeta(t.surah);
        return (
          <Link key={t.surah} href={`/tafsir/${t.surah}`} className="card">
            <div className="num">{t.surah} · {m?.place === 'madinah' ? 'Medinan' : 'Meccan'}</div>
            <div className="en">{m?.name ?? t.name}</div>
            <div className="meta">{m?.meaning}</div>
            <div className="meta" style={{ marginTop: 6, color: 'var(--gold)', opacity: 0.8 }}>
              {t.primary}{t.secondary.length ? ` ${t.secondary.join(' ')}` : ''} · {t.logics.join(' ')}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cat = CATEGORIES.find(c => catSlug(c.key) === slug);
  const logic = logicBySlug(slug);
  if (!cat && !logic) notFound();

  // The wisdom lesson written for this logic, where there is one.
  const lesson = logic ? allWisdom().find(w => w.logic === logic.key) ?? null : null;

  if (cat) {
    const { primary, secondary } = surahsInCategory(cat.key);
    const split = revelationSplit(primary);
    return (
      <main className="container">
        <div className="note">
          <Link href="/tafsir">Tafsir notes</Link> · <Link href="/tafsir/themes">Themes</Link> · {cat.key}
        </div>
        <h1>{cat.key} · {cat.title}</h1>
        <p className="subtitle">{cat.subtitle}</p>
        <p className="lead" style={{ marginTop: 14 }}>{cat.blurb}</p>
        <p className="note" style={{ marginTop: 12 }}>
          {primary.length} surahs have this as their centre of gravity, {split.makkah} Meccan,
          {' '}{split.madinah} Medinan, and {secondary.length} more touch it.
        </p>

        <h2>Centre of gravity</h2>
        <SurahGrid items={primary} />

        {secondary.length > 0 && (
          <>
            <h2 style={{ marginTop: 34 }}>Also touching it</h2>
            <SurahGrid items={secondary} />
          </>
        )}

        <div className="actions" style={{ marginTop: 30 }}>
          <Link href="/tafsir/themes" className="btn">← All themes</Link>
        </div>
      </main>
    );
  }

  const items = surahsWithLogic(logic!.key);
  return (
    <main className="container">
      <div className="note">
        <Link href="/tafsir">Tafsir notes</Link> · <Link href="/tafsir/themes">Themes</Link> · {logic!.key}
      </div>
      <h1>{logic!.key} · {logic!.title}</h1>
      <p className="lead">{logic!.gist}</p>

      {lesson && (
        <article className="notes-card" style={{ marginTop: 22 }}>
          <h4>{lesson.title}</h4>
          <div className="prose" dangerouslySetInnerHTML={{ __html: lesson.html }} />
          <Link href={`/wisdom#${lesson.slug}`} className="btn" style={{ marginTop: 10 }}>
            Open in Wisdom →
          </Link>
        </article>
      )}

      <h2 style={{ marginTop: 34 }}>Where it runs, in {items.length} surahs</h2>
      <SurahGrid items={items} />

      <div className="actions" style={{ marginTop: 30 }}>
        <Link href="/tafsir/themes" className="btn">← All themes</Link>
      </div>
    </main>
  );
}
