import { NextResponse } from 'next/server';
import { getIbnKathir } from '@/lib/quran';

export const revalidate = 86400;

export async function GET(_: Request, { params }: { params: Promise<{ surah: string; ayah: string }> }) {
  const { surah, ayah } = await params;
  const text = await getIbnKathir(parseInt(surah), parseInt(ayah));
  return NextResponse.json({ source: 'Tafsir Ibn Kathir (abridged)', text });
}
