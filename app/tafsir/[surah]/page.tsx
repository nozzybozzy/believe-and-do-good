import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { surahMeta } from '@/lib/surahs';
import { tafsirFor, readingMinutes, stripMd, type AyahRange, type TafsirSection } from '@/lib/tafsir';
import { themeFor, categoryByKey, logicByKey } from '@/lib/themes';

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surah: String(i + 1) }));
}

type Props = { params: Promise<{ surah: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = parseInt((await params).surah);
  const s = surahMeta(n);
  const d = tafsirFor(n)[0];
  return {
    title: `${s?.name ?? 'Surah ' + n} · Tafsir · Believe & Do Good`,
    description: d?.subtitle ? stripMd(d.subtitle) : `Distilled notes on Surah ${s?.name} from Tafsir Ibn Kathir.`,
  };
}

function rangeLabel(r: AyahRange, multi: boolean) {
  const span = r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`;
  return multi ? `${r.surah}:${span}` : `${r.from === r.to ? 'Ayah' : 'Ayat'} ${span}`;
}

function Section({ s, multi }: { s: TafsirSection; multi: boolean }) {
  const cls = s.kind === 'intro' ? 'tsec intro' : s.kind === 'summary' ? 'tsec summary' : 'tsec';
  return (
    <section id={s.id} className={cls}>
      <h2 dangerouslySetInnerHTML={{ __html: s.headingHtml }} />
      {s.ranges.length > 0 && (
        <div className="ayah-chips">
          {s.ranges.map(r => (
            <Link key={`${r.surah}-${r.from}`} href={`/quran/${r.surah}#ayah-${r.from}`} className="chip small">
              {rangeLabel(r, multi)} in the reader →
            </Link>
          ))}
        </div>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: s.html }} />
    </section>
  );
}

export default async function SurahTafsir({ params }: Props) {
  const n = parseInt((await params).surah);
  const meta = surahMeta(n);
  const docs = tafsirFor(n);
  if (!meta || !docs.length) notFound();

  const head = docs[0];
  const multi = head.surahs.length > 1;
  const minutes = readingMinutes(docs);
  const others = head.surahs.filter(x => x !== n);
  const theme = themeFor(n);

  return (
    <main className="container wide">
      <div className="note">
        <Link href="/tafsir">Tafsir</Link> · Surah {n} · {meta.ayat} ayat · {meta.place === 'makkah' ? 'Meccan' : 'Medinan'} · {minutes} min read
      </div>
      <h1>{head.title.replace(/\s+—\s+Ibn Kathir.*$/, '')}</h1>
      <p className="lead">Ibn Kathir’s tafsir, distilled.</p>
      {head.subtitleHtml && <p className="subtitle" dangerouslySetInnerHTML={{ __html: head.subtitleHtml }} />}
      {others.length > 0 && (
        <p className="note" style={{ marginTop: 8 }}>
          These notes cover {head.surahs.map(x => surahMeta(x)?.name).join(' and ')} together.
        </p>
      )}
      {theme && (
        <div className="theme-tags">
          <span className="label">Themes</span>
          {[theme.primary, ...theme.secondary].map((k, i) => {
            const c = categoryByKey(k);
            if (!c) return null;
            return (
              <Link
                key={k}
                href={`/tafsir/themes/${k.replace('§', 'c')}`}
                className={'chip small' + (i === 0 ? ' on' : '')}
                title={c.subtitle}
              >
                {k} {c.title}
              </Link>
            );
          })}
          {theme.logics.map(k => {
            const l = logicByKey(k);
            if (!l) return null;
            return (
              <Link key={k} href={`/tafsir/themes/${l.slug}`} className="chip small" title={l.gist}>
                {k} {l.title}
              </Link>
            );
          })}
        </div>
      )}

      <div className="actions">
        <Link href={`/quran/${n}`} className="btn gold">Read the surah</Link>
        <Link href={`/player/${n}`} className="btn">▶ Listen</Link>
        <Link href="/tafsir/themes" className="btn">Themes</Link>
        {n > 1 && <Link href={`/tafsir/${n - 1}`} className="btn">← {surahMeta(n - 1)?.name}</Link>}
        {n < 114 && <Link href={`/tafsir/${n + 1}`} className="btn">{surahMeta(n + 1)?.name} →</Link>}
      </div>

      <div className="tafsir-layout">
        <nav className="toc" aria-label="Contents">
          <div className="toc-title">Contents</div>
          {docs.map(d => (
            <div key={d.file}>
              {d.partLabel && <div className="toc-part">{d.partLabel}</div>}
              <ol>
                {d.sections.map(s => (
                  <li key={s.id} className={s.kind}>
                    <a href={`#${s.id}`}>{s.heading.replace(/^\d+\.\s*/, '')}</a>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </nav>

        <article className="tafsir-body">
          {docs.map(d => (
            <div key={d.file}>
              {d.partLabel && <div className="part-divider" id={`part-${d.part}`}>{d.partLabel}</div>}
              {d.part && d.part > 1 && d.subtitleHtml && <p className="subtitle" dangerouslySetInnerHTML={{ __html: d.subtitleHtml }} />}
              {d.preambleHtml && <div className="prose" dangerouslySetInnerHTML={{ __html: d.preambleHtml }} />}
              {d.sections.map(s => (
                <Section key={s.id} s={s} multi={multi} />
              ))}
            </div>
          ))}
          <p className="source-note">
            Notes by the site owner, distilled from Tafsir Ibn Kathir (abridged English edition). The full Ibn Kathir text
            for each ayah is in the <Link href={`/quran/${n}`}>reader</Link>.
          </p>
          <div className="actions">
            {n > 1 && <Link href={`/tafsir/${n - 1}`} className="btn">← {surahMeta(n - 1)?.name}</Link>}
            {n < 114 && <Link href={`/tafsir/${n + 1}`} className="btn">{surahMeta(n + 1)?.name} →</Link>}
          </div>
        </article>
      </div>
    </main>
  );
}
