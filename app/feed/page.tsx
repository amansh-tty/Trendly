'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/wardrobe/Navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

const UNLOCK_THRESHOLD = 3;

const PLACEHOLDER_STYLES = [
  { label: 'Clean Streetwear', bg: '#151520', accent: '#4a4a7a', score: 8 },
  { label: 'Smart Casual',     bg: '#1c1c1c', accent: '#3a3a3a', score: 7 },
  { label: 'Quiet Luxury',     bg: '#2a2520', accent: '#5a4a38', score: 9 },
  { label: 'Old Money',        bg: '#201c18', accent: '#4a3c28', score: 8 },
  { label: 'Workwear',         bg: '#18202a', accent: '#2a3848', score: 6 },
  { label: 'Y2K Revival',      bg: '#20152a', accent: '#4a2860', score: 7 },
] as const;

function ScoreBadge({ score }: { score: number }) {
  const cfg =
    score >= 8
      ? { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', color: '#34d399' }
      : score >= 5
      ? { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' }
      : { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: '#7a7570' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-jost text-[10px] font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {score}/10
    </span>
  );
}

/* ── Locked state ── */
function LockedFeed({ count }: { count: number }) {
  const router = useRouter();
  const remaining = UNLOCK_THRESHOLD - count;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-8">
      <div className="flex flex-col items-center gap-4 max-w-xs">
        <h1 className="font-fraunces text-[28px] leading-tight text-foreground">
          Your feed unlocks after {UNLOCK_THRESHOLD} saves
        </h1>

        {/* Progress dots */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            {Array.from({ length: UNLOCK_THRESHOLD }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all"
                style={
                  i < count
                    ? { background: 'var(--color-accent-gold)' }
                    : {
                        background: 'transparent',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                      }
                }
              />
            ))}
          </div>
          <span className="font-jost text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            {count}/{UNLOCK_THRESHOLD} saved
          </span>
        </div>

        <p className="font-jost text-[14px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Why? We need to know your style before we show you more.
        </p>
      </div>

      <button
        onClick={() => router.push('/')}
        className="h-12 px-8 rounded-[14px] font-jost font-medium text-sm transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-accent-gold)', color: '#0a0a0a' }}
      >
        {remaining === UNLOCK_THRESHOLD
          ? 'Analyse your first outfit'
          : `Save ${remaining} more outfit${remaining > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

/* ── Placeholder feed card ── */
function FeedCard({
  label,
  bg,
  accent,
  score,
  onAnalyse,
}: {
  label: string;
  bg: string;
  accent: string;
  score: number;
  onAnalyse: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-[14px] overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Colour block — acts as the placeholder image */}
      <div
        className="relative aspect-square"
        style={{
          background: `radial-gradient(ellipse at 60% 40%, ${accent} 0%, ${bg} 70%)`,
        }}
      >
        {/* Score badge */}
        <div className="absolute top-2 right-2">
          <ScoreBadge score={score} />
        </div>

        {/* Bottom gradient + label */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pb-3 px-3 pt-8">
          <p className="font-fraunces text-[12px] text-white leading-tight">{label}</p>
        </div>
      </div>

      {/* Analyse CTA */}
      <button
        onClick={onAnalyse}
        className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-white/3 group"
        style={{ background: 'var(--color-surface)' }}
      >
        <span className="font-jost text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          Analyse this look
        </span>
        <ArrowRight
          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--color-accent-gold)' }}
        />
      </button>
    </div>
  );
}

/* ── Main page ── */
export default function FeedPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    supabase
      .from('wardrobe_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count }) => {
        setItemCount(count ?? 0);
        setLoading(false);
      });
  }, [userId]);

  const isUnlocked = userId !== null && itemCount >= UNLOCK_THRESHOLD;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b border-border"
        style={{ background: 'rgba(10,10,10,0.9)' }}
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">
          <span className="font-fraunces text-base text-foreground">Feed</span>
        </div>
      </header>

      {/* Auth/count loading */}
      {loading ? (
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-[14px] overflow-hidden">
                <Skeleton className="aspect-square bg-card" />
                <Skeleton className="h-10 bg-card mt-px" />
              </div>
            ))}
          </div>
        </main>
      ) : !isUnlocked ? (
        /* Locked */
        <LockedFeed count={userId === null ? 0 : itemCount} />
      ) : (
        /* Placeholder feed */
        <main className="max-w-2xl mx-auto w-full px-5 pt-5 pb-8">
          <p
            className="font-jost text-[11px] uppercase tracking-[0.15em] font-medium mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Trending in your style
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PLACEHOLDER_STYLES.map((item) => (
              <FeedCard
                key={item.label}
                label={item.label}
                bg={item.bg}
                accent={item.accent}
                score={item.score}
                onAnalyse={() => router.push('/')}
              />
            ))}
          </div>
        </main>
      )}

      <Navbar />
    </div>
  );
}
