import { NextResponse } from 'next/server';
import { getSurahBundle } from '@/lib/quran';

export const revalidate = 86400;

export async function GET(_: Request, { params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = parseInt(surah);
  if (!n || n < 1 || n > 114) return NextResponse.json({ error: 'Invalid surah' }, { status: 400 });
  try {
    const bundle = await getSurahBundle(n);
    return NextResponse.json(bundle, { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
