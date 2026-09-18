'use client';
import { useEffect, useRef, useState } from 'react';
import LearnMore from './LearnMore';
import './player.css';

type Chapter = { id: number; name_arabic: string; name_simple: string; translated_name: { name: string } };
type Ayah = { key: string; numberInSurah: number; words: string[]; full: string; english: string; from: number | null; to: number | null; segs: number[][] };
type Bundle = { chapter: Chapter; audioUrl: string | null; ayahs: Ayah[] };

const DEFAULT_BG = 'https://images.unsplash.com/photo-1466027397211-20d0f2449a3d?w=1920&q=80';
const DL_ICON = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;

export default function QuranPlayer({ initialSurah, initialAyah = 1 }: { initialSurah: number; initialAyah?: number }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [surah, setSurah] = useState(initialSurah);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [idx, setIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Loading…');
  const [bg, setBg] = useState<{ type: 'image' | 'video'; url: string }>({ type: 'image', url: DEFAULT_BG });
  const [exporting, setExporting] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number>(0);
  const idxRef = useRef(0);
  const bundleRef = useRef<Bundle | null>(null);
  const playingRef = useRef(false);
  const firstLoad = useRef(true);

  useEffect(() => { fetch('/api/quran/chapters').then(r => r.json()).then(setChapters); }, []);

  useEffect(() => {
    let alive = true;
    setStatus('Loading…'); setBundle(null); setIdx(0); setWordIdx(-1); stop();
    fetch(`/api/quran/${surah}`).then(r => r.json()).then((b: Bundle) => {
      if (!alive) return;
      // Only the first surah honours ?ayah=; switching surah starts at the top.
      const start = firstLoad.current
        ? Math.min(Math.max(1, initialAyah) - 1, b.ayahs.length - 1)
        : 0;
      firstLoad.current = false;
      setBundle(b); bundleRef.current = b; idxRef.current = start; setIdx(start);
      const a = audioRef.current!;
      if (b.audioUrl) { a.src = b.audioUrl; a.load(); }
      setStatus(`${b.chapter.name_simple} · ${b.ayahs.length} ayahs · Saad Al-Ghamdi`);
    }).catch(e => alive && setStatus('Error: ' + e.message));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah]);

  // Keep the address bar on the current ayah so links are shareable.
  // history.replaceState rather than the router: no server round-trip per ayah.
  useEffect(() => {
    if (!bundle) return;
    const url = `/player/${surah}?ayah=${idx + 1}`;
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [surah, idx, bundle]);

  function goTo(i: number) { idxRef.current = i; setIdx(i); setWordIdx(-1); }

  function tick() {
    const b = bundleRef.current; const a = audioRef.current;
    if (!playingRef.current || !b || !a) return;
    const ms = a.currentTime * 1000;
    let i = idxRef.current;
    const cur = b.ayahs[i];
    if (cur.to !== null && ms >= cur.to && i < b.ayahs.length - 1) { i++; goTo(i); }
    const segs = b.ayahs[i].segs;
    let w = -1;
    for (const s of segs) { if (ms >= s[1]) w = s[0] - 1; if (ms >= s[1] && ms <= s[2]) { w = s[0] - 1; break; } }
    setWordIdx(w);
    rafRef.current = requestAnimationFrame(tick);
  }

  function play() {
    const b = bundleRef.current; const a = audioRef.current;
    if (!b || !a) return;
    playingRef.current = true; setPlaying(true);
    const cur = b.ayahs[idxRef.current];
    if (cur.from !== null) a.currentTime = cur.from / 1000;
    a.play().catch(() => {});
    rafRef.current = requestAnimationFrame(tick);
  }
  function stop() {
    playingRef.current = false; setPlaying(false);
    audioRef.current?.pause();
    cancelAnimationFrame(rafRef.current);
  }
  function seekTo(i: number) {
    const b = bundleRef.current; if (!b) return;
    i = Math.max(0, Math.min(b.ayahs.length - 1, i));
    goTo(i);
    const a = audioRef.current; const cur = b.ayahs[i];
    if (playingRef.current && a && cur.from !== null) a.currentTime = cur.from / 1000;
  }

  function onBgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBg({ type: f.type.startsWith('video/') ? 'video' : 'image', url: URL.createObjectURL(f) });
  }

  async function exportVideo() {
    const b = bundleRef.current; if (!b || !b.audioUrl || exporting) return;
    setExporting(true);
    const W = 1920, H = 1080;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    const stream = cv.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    rec.ondataavailable = ev => { if (ev.data.size) chunks.push(ev.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `quran_${b.chapter.id}_${b.chapter.name_simple}.webm`;
      link.click();
      setExporting(false);
      setStatus('Export complete. YouTube accepts WebM directly; for MP4 use cloudconvert.com');
    };
    const bgEl = bg.type === 'image' ? bgImgRef.current : null;

    const draw = (ai: number, wi: number) => {
      ctx.clearRect(0, 0, W, H);
      if (bgEl && bgEl.complete) { ctx.globalAlpha = .55; ctx.drawImage(bgEl, 0, 0, W, H); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = '#0a1628'; ctx.fillRect(0, 0, W, H); }
      const g = ctx.createLinearGradient(0, H * .5, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.92)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '22px sans-serif'; ctx.fillText(`Surah ${b.chapter.id}`, 60, 60);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 40px "Scheherazade New", serif'; ctx.fillText(b.chapter.name_arabic, 60, 108);
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = '22px sans-serif'; ctx.fillText(b.chapter.name_simple, 60, 142);
      const a = b.ayahs[ai];
      ctx.font = '52px "Scheherazade New", serif'; ctx.textAlign = 'center';
      const sp = 12; let lw = 0; a.words.forEach(w => { lw += ctx.measureText(w).width + sp; });
      let cx = W / 2 + lw / 2;
      a.words.forEach((w, i) => { ctx.fillStyle = i === wi ? '#ffe082' : 'rgba(255,255,255,.82)'; const ww = ctx.measureText(w).width; cx -= ww; ctx.fillText(w, cx, H - 220); cx -= sp; });
      ctx.fillStyle = 'rgba(255,200,80,.85)'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(String(a.numberInSurah), W - 70, H - 212);
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = 'italic 28px sans-serif';
      const lines: string[] = []; let line = '';
      a.english.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > W - 200 && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      lines.forEach((l, i) => ctx.fillText(l, W / 2, H - 150 + i * 40));
    };

    const tmp = new Audio(b.audioUrl); tmp.crossOrigin = 'anonymous';
    const actx = new AudioContext();
    const src = actx.createMediaElementSource(tmp);
    const dest = actx.createMediaStreamDestination();
    src.connect(dest); src.connect(actx.destination);
    dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    await new Promise(res => tmp.addEventListener('canplay', res, { once: true }));
    rec.start(); tmp.play();
    await new Promise<void>(res => {
      const iv = setInterval(() => {
        const ms = tmp.currentTime * 1000;
        let ai = 0; for (let i = 0; i < b.ayahs.length; i++) if (b.ayahs[i].from !== null && ms >= b.ayahs[i].from!) ai = i;
        let wi = -1; for (const s of b.ayahs[ai].segs) { if (ms >= s[1]) wi = s[0] - 1; if (ms >= s[1] && ms <= s[2]) { wi = s[0] - 1; break; } }
        setStatus(`Exporting ayah ${ai + 1}/${b.ayahs.length}…`);
        draw(ai, wi);
        if (tmp.ended) { clearInterval(iv); res(); }
      }, 1000 / 30);
      tmp.addEventListener('ended', () => { clearInterval(iv); res(); }, { once: true });
    });
    rec.stop(); actx.close();
  }

  const cur = bundle?.ayahs[idx];
  const ch = bundle?.chapter;

  return (
    <div className="qp-page">
    <div className="qp">
      {bg.type === 'image'
        ? <img ref={bgImgRef} className="qp-bg" src={bg.url} alt="" crossOrigin="anonymous" />
        : <video className="qp-bg" src={bg.url} autoPlay loop muted playsInline />}
      <div className="qp-overlay" />

      <div className="qp-header">
        <div className="qp-snum">Surah {ch?.id ?? surah}</div>
        <div className="qp-sar ar">{ch?.name_arabic}</div>
        <div className="qp-sen">{ch ? `${ch.name_simple} – ${ch.translated_name.name}` : ''}</div>
      </div>

      <div className="qp-text">
        <div className="qp-arabic ar">
          {cur?.words.map((w, i) => <span key={i} className={'qp-word' + (i === wordIdx ? ' active' : '')}>{w}</span>)}
          {cur && <span className="qp-badge">{cur.numberInSurah}</span>}
        </div>
        <div className="qp-english">{cur?.english}</div>
      </div>

      <div className="qp-controls">
        <select className="qp-select" value={surah} onChange={e => setSurah(parseInt(e.target.value))}>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.id}. {c.name_simple} – {c.name_arabic}</option>)}
        </select>
        <div className="qp-btns">
          <button className="qp-btn" onClick={() => seekTo(idx - 1)} title="Previous ayah"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
          <button className="qp-btn play" onClick={() => playing ? stop() : play()}>
            <svg viewBox="0 0 24 24"><path d={playing ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' : 'M8 5v14l11-7z'} /></svg>
          </button>
          <button className="qp-btn" onClick={() => seekTo(idx + 1)} title="Next ayah"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2-8.14 5.94 2.14L8 14.14V9.86zM16 6h2v12h-2z"/></svg></button>
        </div>
        <div className="qp-right">
          <label className="qp-upload">Background<input type="file" accept="image/*,video/*" hidden onChange={onBgFile} /></label>
          <button className="qp-dl" disabled={!bundle || exporting} onClick={exportVideo}>{DL_ICON} {exporting ? 'Exporting…' : 'Export Video'}</button>
        </div>
      </div>
      <div className="qp-status">{status}</div>
      <audio ref={audioRef} crossOrigin="anonymous" onEnded={() => { stop(); setStatus('Playback complete'); }} />
    </div>

    {cur && ch && (
      <LearnMore
        surah={ch.id}
        ayah={cur.numberInSurah}
        surahName={ch.name_simple}
        english={cur.english}
      />
    )}
    </div>
  );
}
