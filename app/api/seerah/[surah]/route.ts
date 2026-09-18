import { NextResponse } from 'next/server';
import { seerahSnippetsJson } from '@/lib/seerah';

// Seerah entries are markdown in the repo, so this only changes on deploy.
export const revalidate = false;

export async function GET(_req: Request, { params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = parseInt(surah);
  if (!(n >= 1 && n <= 114)) return NextResponse.json({ error: 'bad surah' }, { status: 400 });
  return NextResponse.json({ surah: n, byAyah: seerahSnippetsJson(n) });
}
