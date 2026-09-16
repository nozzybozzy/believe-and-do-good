import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/quran';

export const revalidate = 86400;

export async function GET() {
  return NextResponse.json(await getChapters());
}
