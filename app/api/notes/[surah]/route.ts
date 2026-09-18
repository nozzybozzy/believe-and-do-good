import { NextResponse } from 'next/server';
import { ayahNotesJson, tafsirFor, readingMinutes } from '@/lib/tafsir';

// Notes are markdown in the repo, so this only changes on deploy.
export const revalidate = false;

export async function GET(_req: Request, { params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = parseInt(surah);
  if (!(n >= 1 && n <= 114)) return NextResponse.json({ error: 'bad surah' }, { status: 400 });

  const docs = tafsirFor(n);
  return NextResponse.json({
    surah: n,
    hasNotes: docs.length > 0,
    minutes: docs.length ? readingMinutes(docs) : 0,
    byAyah: ayahNotesJson(n),
  });
}
