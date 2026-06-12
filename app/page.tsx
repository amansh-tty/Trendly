'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/wardrobe/Navbar';
import SaveModal from '@/components/wardrobe/SaveModal';
import { supabase } from '@/lib/supabase';
import { Loader2, RotateCcw, ArrowRight } from 'lucide-react';
import type { AiSections, AiSection, AiAccessories } from '@/types';

type Status = 'idle' | 'uploading' | 'analyzing' | 'done';
type View = 'hero' | 'preview' | 'sample-select' | 'result' | 'error';

interface AnalysisResult {
  aiSections: AiSections;
  imageUrl: string;
  sampleBg?: string;
}

const SAMPLES = [
  {
    id: 'streetwear',
    label: 'Streetwear',
    file: '/samples/streetwear-sample.json',
    bg: '#1a1a2e',
    textDark: false,
  },
  {
    id: 'smart-casual',
    label: 'Smart Casual',
    file: '/samples/smart-casual-sample.json',
    bg: '#2d2d2d',
    textDark: false,
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    file: '/samples/minimalist-sample.json',
    bg: '#f0ece4',
    textDark: true,
  },
] as const;

/* ─── Section card ─── */
function SectionCard({ label, section }: { label: string; section: AiSection | AiAccessories }) {
  if (!section.detected) return null;
  const isAccessories = 'items' in section;
  const acc = isAccessories ? (section as AiAccessories) : null;
  const sec = !isAccessories ? (section as AiSection) : null;

  return (
    <div className="bg-card border border-border rounded-[14px] p-4 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground font-jost">
          {label}
        </span>
        {sec?.dominant_color_hex && (
          <span className="flex items-center gap-1.5 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
              style={{ backgroundColor: sec.dominant_color_hex }}
            />
            <span className="text-[11px] text-muted-foreground font-jost">{sec.color}</span>
          </span>
        )}
      </div>

      {/* Description */}
      <p className="font-jost text-[13px] text-foreground/80 leading-relaxed">
        {sec ? sec.description : acc!.items.join(', ')}
      </p>

      {/* Accessories impact note */}
      {acc?.impact && (
        <p className="font-jost text-[12px] text-muted-foreground italic leading-snug">{acc.impact}</p>
      )}

      {/* Style tags */}
      {section.style_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {section.style_tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium font-jost"
              style={{
                background: 'var(--color-accent-glow)',
                border: '1px solid rgba(200,176,138,0.2)',
                color: 'var(--color-accent-gold)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Score badge ─── */
function ScoreBadge({ score }: { score: number }) {
  const cfg =
    score >= 8
      ? { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#34d399' }
      : score >= 5
      ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' }
      : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: '#7a7570' };

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full font-jost text-xs font-medium"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {score}/10
    </span>
  );
}

/* ─── Sample select ─── */
function SampleSelectView({
  onSelect,
  onBack,
}: {
  onSelect: (sample: (typeof SAMPLES)[number]) => void;
  onBack: () => void;
}) {
  return (
    <>
      <header className="px-6 pt-7 pb-2 flex items-center justify-between">
        <span className="font-fraunces italic text-sm tracking-tight" style={{ color: 'var(--color-text)' }}>
          Trendly
        </span>
        <button
          onClick={onBack}
          className="font-jost text-xs transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ← Back
        </button>
      </header>

      <main className="flex flex-col gap-6 px-5 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h2 className="font-fraunces text-[28px] leading-tight text-foreground">
            Try a sample look
          </h2>
          <p className="font-jost text-[14px] text-muted-foreground">
            See what a full style read looks like
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelect(sample)}
              className="relative flex flex-col rounded-[14px] overflow-hidden group focus:outline-none text-left"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Colour block */}
              <div
                className="w-full"
                style={{ background: sample.bg, aspectRatio: '5/2' }}
              />
              {/* Label row */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="font-fraunces text-[17px] text-foreground leading-none">
                  {sample.label}
                </span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5 shrink-0"
                  style={{ color: 'var(--color-accent-gold)' }}
                />
              </div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}

/* ─── Analysis panel ─── */
function AnalysisPanel({
  result,
  onReset,
  onSave,
  onReupload,
}: {
  result: AnalysisResult;
  onReset: () => void;
  onSave: () => void;
  onReupload?: () => void;
}) {
  const { aiSections, imageUrl } = result;
  const {
    sections,
    overall_style,
    fit_notes,
    one_improvement,
    style_confidence_score,
    occasion_fit,
  } = aiSections;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 pb-12">

      {/* ── Left: image or sample colour block ── */}
      <div className="w-full lg:w-[45%] lg:sticky lg:top-6 lg:self-start">
        {result.sampleBg ? (
          <div
            className="relative w-full rounded-[14px] overflow-hidden"
            style={{ background: result.sampleBg, aspectRatio: '3/4' }}
          >
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full font-jost text-[11px] font-medium"
              style={{
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f0ece4',
              }}
            >
              Sample outfit
            </span>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Uploaded outfit"
              className="w-full max-h-100 lg:max-h-none object-cover rounded-[14px]"
            />
            {onReupload && (
              <button
                onClick={onReupload}
                className="mt-2 w-full font-jost text-[12px] py-1 text-center transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                Upload a different photo
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Right: results panel ── */}
      <div className="flex flex-col gap-6 lg:w-[55%]">

        {/* A — Style verdict */}
        <div className="flex flex-col gap-1.5">
          <p
            className="font-jost text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: 'var(--color-accent-gold)' }}
          >
            Overall Style
          </p>
          <h1 className="font-fraunces text-[32px] leading-[1.1] text-foreground">
            {overall_style
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(' · ')}
          </h1>
        </div>

        {/* B — Score badge */}
        <ScoreBadge score={style_confidence_score} />

        {/* C — Fit read */}
        <div className="pl-4 py-0.5" style={{ borderLeft: '2px solid var(--color-accent-gold)' }}>
          <p className="font-jost text-[15px] text-foreground/80 leading-[1.7]">{fit_notes}</p>
        </div>

        {/* D — Breakdown */}
        <div className="flex flex-col gap-3">
          <p className="font-jost text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
            Breakdown
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SectionCard label="Top" section={sections.top} />
            <SectionCard label="Bottom" section={sections.bottom} />
            <SectionCard label="Shoes" section={sections.shoes} />
            <SectionCard label="Accessories" section={sections.accessories} />
          </div>
        </div>

        {/* E — The one thing */}
        {one_improvement && (
          <div
            className="rounded-[14px] p-5 flex flex-col gap-3"
            style={{
              background: 'rgba(200,176,138,0.08)',
              border: '1px solid rgba(200,176,138,0.25)',
            }}
          >
            <p
              className="font-fraunces text-[16px] italic leading-snug"
              style={{ color: 'var(--color-accent-gold)' }}
            >
              What would make this 10× better
            </p>
            <p className="font-jost text-[14px] text-foreground/80 leading-relaxed">
              {one_improvement}
            </p>
            {occasion_fit?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-jost text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Works for:
                </span>
                {occasion_fit.map((occ) => (
                  <span
                    key={occ}
                    className="px-2.5 py-0.5 rounded-full font-jost text-[11px] text-muted-foreground"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {occ}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* F — Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {result.sampleBg ? (
            <button
              onClick={onReset}
              className="flex-1 h-12 rounded-[14px] font-jost font-medium text-sm tracking-wide transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
            >
              Analyse your own outfit
            </button>
          ) : (
            <>
              <button
                onClick={onSave}
                className="flex-1 h-12 rounded-[14px] font-jost font-medium text-sm tracking-wide transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
              >
                Save to my closet
              </button>
              <button
                onClick={onReset}
                className="flex-1 h-12 rounded-[14px] font-jost text-sm border transition-colors hover:border-white/20 flex items-center justify-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text-secondary)' }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Analyse another
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('hero');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setView('preview');
  };

  const handleAnalyze = async () => {
    if (!blob) return;
    setError(null);
    try {
      setStatus('uploading');
      const reader = new FileReader();
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      setStatus('analyzing');
      const response = await fetch('/api/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult({ aiSections: data.aiSections, imageUrl: data.imageUrl });
      setStatus('done');
      setView('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setStatus('idle');
      setView('error');
    }
  };

  const handleReupload = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleReset = () => {
    setBlob(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatus('idle');
    setView('hero');
    if (inputRef.current) inputRef.current.value = '';
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const saveToCloset = async (uid: string, data: AnalysisResult) => {
    const { aiSections, imageUrl } = data;
    const allTags = [
      ...aiSections.sections.top.style_tags,
      ...aiSections.sections.bottom.style_tags,
      ...aiSections.sections.shoes.style_tags,
      ...aiSections.sections.accessories.style_tags,
      ...aiSections.overall_style,
    ];
    const hasTop = aiSections.sections.top.detected;
    const hasBottom = aiSections.sections.bottom.detected;
    const category = hasTop && hasBottom ? 'outfit' : hasTop ? 'top' : hasBottom ? 'bottom' : 'outfit';

    const { error: dbError } = await supabase.from('wardrobe_items').insert({
      user_id: uid,
      image_url: imageUrl,
      ai_sections: aiSections,
      style_tags: Array.from(new Set(allTags)),
      category,
      is_public: false,
    });
    if (dbError) throw dbError;
  };

  const handleSampleSelect = async (sample: (typeof SAMPLES)[number]) => {
    try {
      setStatus('analyzing');
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error('Failed to load sample');
      const aiSections: AiSections = await res.json();
      setResult({ aiSections, imageUrl: '', sampleBg: sample.bg });
      setStatus('done');
      setView('result');
    } catch {
      setError('Failed to load sample');
      setStatus('idle');
    }
  };

  const handleSaveClick = async () => {
    if (!result) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      try {
        await saveToCloset(data.user.id, result);
        showToast('Added to your closet ✦');
      } catch {
        showToast('Save failed — try again');
      }
    } else {
      localStorage.setItem('pendingAnalysis', JSON.stringify(result));
      setShowModal(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const uid = session.user.id;
          setShowModal(false);
          const pending = localStorage.getItem('pendingAnalysis');
          if (pending) {
            localStorage.removeItem('pendingAnalysis');
            try {
              const saved = JSON.parse(pending) as AnalysisResult;
              setResult(saved);
              setView('result');
              await saveToCloset(uid, saved);
              showToast('Added to your closet ✦');
            } catch {
              showToast('Save failed — try again');
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === 'uploading' || status === 'analyzing';
  const loadingLabel = status === 'uploading' ? 'Uploading…' : 'Analysing outfit…';

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Hero ── */}
      {view === 'hero' && (
        <>
          <header className="px-6 pt-7">
            <span className="font-fraunces italic text-sm tracking-tight" style={{ color: 'var(--color-text)' }}>
              Trendly
            </span>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-7">
            <div className="flex flex-col items-center gap-3 max-w-xs">
              <h1 className="font-fraunces text-[40px] leading-[1.1] tracking-tight text-foreground">
                Your style,<br />understood.
              </h1>
              <p className="font-jost text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Upload any outfit. Get an instant AI style read.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px] sm:max-w-xs">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex-1 h-12 rounded-[14px] font-jost font-medium text-sm tracking-wide transition-colors"
                style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Upload an outfit
              </button>
              <button
                onClick={() => setView('sample-select')}
                className="flex-1 h-12 rounded-[14px] font-jost font-medium text-sm tracking-wide border transition-colors hover:border-white/20"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text-secondary)' }}
              >
                Try a sample
              </button>
            </div>
          </main>

          <footer className="text-center pb-8">
            <p className="font-jost text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
              Instant · No account needed · Private by default
            </p>
          </footer>
        </>
      )}

      {/* ── Sample select ── */}
      {view === 'sample-select' && (
        <SampleSelectView
          onSelect={handleSampleSelect}
          onBack={() => setView('hero')}
        />
      )}

      {/* ── Preview ── */}
      {view === 'preview' && (
        <>
          <header className="px-6 pt-7 pb-2 flex items-center justify-between">
            <span className="font-fraunces italic text-sm tracking-tight" style={{ color: 'var(--color-text)' }}>
              Trendly
            </span>
            <button
              onClick={handleReset}
              className="font-jost text-xs transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              ← Back
            </button>
          </header>

          <main className="flex flex-col items-center px-5 pt-4 gap-5">
            {previewUrl && (
              <div
                className="relative w-full max-w-[360px] rounded-[14px] overflow-hidden cursor-pointer group"
                onClick={() => !isLoading && inputRef.current?.click()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full object-cover" />
                {!isLoading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="font-jost text-xs text-white/70">Change photo</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="font-jost text-sm text-red-400 w-full max-w-[360px] px-4 py-3 rounded-[14px] bg-red-950/30 border border-red-800/40">
                {error}
              </p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full max-w-[360px] h-12 rounded-[14px] font-jost font-medium text-sm tracking-wide transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</>
              ) : (
                'Analyse outfit'
              )}
            </button>
          </main>
        </>
      )}

      {/* ── Error ── */}
      {view === 'error' && (
        <>
          <header className="px-6 pt-7 pb-2">
            <span className="font-fraunces italic text-sm tracking-tight" style={{ color: 'var(--color-text)' }}>
              Trendly
            </span>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
            <div className="flex flex-col items-center gap-3 max-w-70">
              <h2 className="font-fraunces text-[32px] leading-tight text-foreground">
                Something went wrong
              </h2>
              <p className="font-jost text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                Try a clearer photo with good lighting
              </p>
            </div>
            <button
              onClick={() => { handleReset(); inputRef.current?.click(); }}
              className="h-12 px-8 rounded-[14px] font-jost font-medium text-sm tracking-wide transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
            >
              Try another photo
            </button>
          </main>
        </>
      )}

      {/* ── Result ── */}
      {view === 'result' && result && (
        <main className="max-w-2xl mx-auto w-full px-5 pt-6">
          <AnalysisPanel result={result} onReset={handleReset} onSave={handleSaveClick} onReupload={handleReupload} />
        </main>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-[10px] border border-border shadow-lg font-jost text-sm text-foreground whitespace-nowrap animate-in slide-in-from-top duration-300" style={{ background: 'var(--color-surface)' }}>
          {toastMsg}
        </div>
      )}

      <SaveModal open={showModal} onClose={() => setShowModal(false)} />

      <Navbar />
    </div>
  );
}
