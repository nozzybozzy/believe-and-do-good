import QuranPlayer from '@/components/player/QuranPlayer';
import { surahMeta } from '@/lib/surahs';

export async function generateMetadata({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const meta = surahMeta(parseInt(surah) || 1);
  return {
    title: meta ? `${meta.name} · Player · Believe & Do Good` : 'Player · Believe & Do Good',
    description: 'Listen with word-by-word highlighting, then read the notes, Ibn Kathir and seerah for the ayah you are on.',
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ surah: string }>;
  searchParams: Promise<{ ayah?: string }>;
}) {
  const { surah } = await params;
  const { ayah } = await searchParams;
  const n = Math.min(114, Math.max(1, parseInt(surah) || 1));
  const a = Math.max(1, parseInt(ayah ?? '1') || 1);
  return <QuranPlayer initialSurah={n} initialAyah={a} />;
}
