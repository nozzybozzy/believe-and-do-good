// Server-side helpers. These run on the server (route handlers / server components),
// so there are no browser CORS restrictions.

const QF = 'https://api.quran.com/api/v4';
const AQ = 'https://api.alquran.cloud/v1';
export const RECITER_ID = 13; // Saad al-Ghamdi (chapter recitations). NB: 7 is Mishari al-Afasy.
export const IBN_KATHIR_ID = 169; // Tafsir Ibn Kathir (abridged), English

const opts = { next: { revalidate: 86400 } } as const;

export type Chapter = {
  id: number; name_arabic: string; name_simple: string; verses_count: number;
  revelation_place: string; translated_name: { name: string };
};

export async function getChapters(): Promise<Chapter[]> {
  const r = await fetch(`${QF}/chapters?language=en`, opts);
  const j = await r.json();
  return j.chapters;
}

export type Ayah = {
  key: string; numberInSurah: number; words: string[]; full: string; english: string;
  from: number | null; to: number | null; segs: number[][];
};

export type SurahBundle = { chapter: Chapter; reciter: string; audioUrl: string | null; hasWordTiming: boolean; ayahs: Ayah[] };

export async function getSurahBundle(n: number, reciter = RECITER_ID): Promise<SurahBundle> {
  const [chapters, vRes, tRes, aRes] = await Promise.all([
    getChapters(),
    fetch(`${QF}/verses/by_chapter/${n}?language=en&words=true&word_fields=text_uthmani&fields=text_uthmani&per_page=300`, opts),
    fetch(`${AQ}/surah/${n}/en.sahih`, opts),
    fetch(`${QF}/chapter_recitations/${reciter}/${n}?segments=true`, opts),
  ]);
  const chapter = chapters.find(c => c.id === n)!;
  const v = await vRes.json();
  const t = await tRes.json();
  const a = await aRes.json();

  const trans: Record<number, string> = {};
  (t.data?.ayahs || []).forEach((x: any) => { trans[x.numberInSurah] = x.text; });

  const ts: Record<string, any> = {};
  (a.audio_file?.timestamps || []).forEach((x: any) => { ts[x.verse_key] = x; });

  let hasWordTiming = false;
  const ayahs: Ayah[] = (v.verses || []).map((x: any) => {
    const words = (x.words || []).filter((w: any) => w.char_type_name !== 'end').map((w: any) => w.text_uthmani || w.text);
    const tt = ts[x.verse_key];
    // keep only well-formed [word_index, start, end] triples
    const segs: number[][] = tt ? (tt.segments || []).filter((s: any) => Array.isArray(s) && s.length >= 3) : [];
    if (segs.length) hasWordTiming = true;
    return {
      key: x.verse_key,
      numberInSurah: x.verse_number,
      words,
      full: x.text_uthmani || '',
      english: trans[x.verse_number] || '',
      from: tt ? tt.timestamp_from : null,
      to: tt ? tt.timestamp_to : null,
      segs,
    };
  });

  return { chapter, reciter: String(reciter), audioUrl: a.audio_file?.audio_url || null, hasWordTiming, ayahs };
}

export async function getIbnKathir(surah: number, ayah: number): Promise<string> {
  const r = await fetch(`${QF}/tafsirs/${IBN_KATHIR_ID}/by_ayah/${surah}:${ayah}`, opts);
  if (!r.ok) return '';
  const j = await r.json();
  return j.tafsir?.text || '';
}
