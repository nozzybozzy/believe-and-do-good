import QuranPlayer from '@/components/player/QuranPlayer';

export default async function PlayerPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = Math.min(114, Math.max(1, parseInt(surah) || 1));
  return <QuranPlayer initialSurah={n} />;
}
