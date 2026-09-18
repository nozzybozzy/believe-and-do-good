import { NextResponse } from 'next/server';
import { search, type Kind } from '@/lib/search';

export const revalidate = false;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const kind = (searchParams.get('kind') as Kind | null) || null;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '40') || 40));
  return NextResponse.json(search(q, { kind, limit }));
}
